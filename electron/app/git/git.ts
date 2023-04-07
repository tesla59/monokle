import {promises as fs} from 'fs';
import {orderBy} from 'lodash';
import {SimpleGit, simpleGit} from 'simple-git';

import type {FileMapType} from '@shared/models/appState';
import type {GitRepo} from '@shared/models/git';
import {isHelmChartFile, isHelmTemplateFile, isHelmValuesFile} from '@shared/utils/helm';
import {isKustomizationFilePath} from '@shared/utils/kustomize';
import {trackEvent} from '@shared/utils/telemetry';

import {formatGitChangedFiles} from '../utils/git';

export async function getGitRemoteUrl(path: string) {
  const git: SimpleGit = simpleGit({baseDir: path});

  try {
    const result = await git.raw('config', '--get', 'remote.origin.url');
    return result;
  } catch (e: any) {
    return {error: e.message};
  }
}

export async function getRemotePath(localPath: string) {
  const git: SimpleGit = simpleGit({baseDir: localPath});

  try {
    const gitFolderPath = await git.revparse({'--show-toplevel': null});
    return gitFolderPath;
  } catch (e: any) {
    return {error: e.message};
  }
}

export async function cloneGitRepo(payload: {localPath: string; repoPath: string}) {
  const {localPath, repoPath} = payload;
  try {
    const stat = await fs.stat(localPath);
    if (!stat.isDirectory()) {
      throw new Error(`${localPath} is not a directory`);
    }
  } catch (e: any) {
    if (e.code === 'ENOENT') {
      await fs.mkdir(localPath);
    } else {
      throw e;
    }
  }
  const git: SimpleGit = simpleGit({baseDir: localPath});
  try {
    await git.clone(repoPath, localPath);
  } catch (e: any) {
    return {error: e.message};
  }

  return {};
}

export async function getGitRepoInfo(localPath: string) {
  const git: SimpleGit = simpleGit({baseDir: localPath});

  let gitRepo: GitRepo;

  try {
    const remoteBranchSummary = await git.branch({'-r': null});
    const localBranches = await git.branchLocal();
    const remoteUrl = await getGitRemoteUrl(localPath);

    gitRepo = {
      branches: [...localBranches.all, ...remoteBranchSummary.all],
      currentBranch: localBranches.current || remoteBranchSummary.current,
      branchMap: {},
      commits: {ahead: 0, behind: 0},
      remoteRepo: {exists: false, authRequired: false},
    };

    if (typeof remoteUrl === 'string') {
      gitRepo.remoteUrl = remoteUrl.replaceAll('.git', '');
    }

    gitRepo.branchMap = Object.fromEntries(
      Object.entries({...localBranches.branches}).map(([key, value]) => [
        key,
        {name: value.name, commitSha: value.commit, type: 'local'},
      ])
    );

    gitRepo.branchMap = {
      ...gitRepo.branchMap,
      ...Object.fromEntries(
        Object.entries({...remoteBranchSummary.branches}).map(([key, value]) => [
          key,
          {name: value.name.replace('remotes/', ''), commitSha: value.commit, type: 'remote'},
        ])
      ),
    };
  } catch (e) {
    return undefined;
  }

  const branchMapValues = Object.values(gitRepo.branchMap);

  for (let i = 0; i < branchMapValues.length; i += 1) {
    const branchName = branchMapValues[i].name;

    // get the list of commits for each branch found
    const commits = [
      // eslint-disable-next-line no-await-in-loop
      ...(await git.log({[branchName]: null})).all,
    ];

    branchMapValues[i].commits = orderBy(commits, ['date'], ['desc']);
  }

  try {
    await git.remote(['show', 'origin']);
    gitRepo.remoteRepo = {exists: true, authRequired: false};
  } catch (e: any) {
    if (e.message.includes('Authentication failed')) {
      gitRepo.remoteRepo = {
        exists: true,
        authRequired: true,
        errorMessage: e.message.split('fatal: ').pop().replaceAll("'", ''),
      };
    }
  }

  try {
    const [aheadCommits, behindCommits] = (
      await git.raw('rev-list', '--left-right', '--count', `${gitRepo.currentBranch}...origin/${gitRepo.currentBranch}`)
    )
      .trim()
      .split('\t');

    gitRepo.commits.ahead = parseInt(aheadCommits, 10);
    gitRepo.commits.behind = parseInt(behindCommits, 10);
  } catch (e) {
    return gitRepo;
  }

  return gitRepo;
}

export async function checkoutGitBranch(payload: {localPath: string; branchName: string}) {
  const {localPath, branchName} = payload;
  const git: SimpleGit = simpleGit({baseDir: localPath});

  try {
    await git.checkout(branchName);
    trackEvent('git/branch_checkout');
    return {};
  } catch (e: any) {
    return {error: e.message};
  }
}

export async function initGitRepo(localPath: string) {
  const git: SimpleGit = simpleGit({baseDir: localPath});

  try {
    await git.init();
    await git.commit('Initial commit', undefined, {'--allow-empty': null});
  } catch (e: any) {
    return {error: e.message};
  }
}

export async function getChangedFiles(localPath: string, fileMap: FileMapType) {
  const git: SimpleGit = simpleGit({baseDir: localPath});

  const projectFolderPath = fileMap['<root>'].filePath;

  try {
    const gitFolderPath = await git.revparse({'--show-toplevel': null});
    const currentBranch = (await git.branch()).current;

    const branchStatus = await git.status({'-z': null, '-uall': null});
    const files = branchStatus.files;

    const changedFiles = formatGitChangedFiles(files, fileMap, projectFolderPath, gitFolderPath, git);

    for (let i = 0; i < changedFiles.length; i += 1) {
      if (!changedFiles[i].originalContent) {
        let originalContent: string = '';

        try {
          // eslint-disable-next-line no-await-in-loop
          originalContent = await git.show(`${currentBranch}:${changedFiles[i].gitPath}`);
        } catch (error) {
          originalContent = '';
        }

        changedFiles[i].originalContent = originalContent;
      }
    }

    return changedFiles;
  } catch (e: any) {
    return {error: e.message};
  }
}

export async function stageChangedFiles(localPath: string, filePaths: string[]) {
  const git: SimpleGit = simpleGit({baseDir: localPath});

  try {
    await git.add(filePaths);
    return {};
  } catch (e: any) {
    return {error: e.message};
  }
}

export async function unstageFiles(localPath: string, filePaths: string[]) {
  const git: SimpleGit = simpleGit({baseDir: localPath});

  const unstageProperties = filePaths.reduce((prev, current) => {
    return {...prev, [current]: null};
  }, {} as any);

  try {
    await git.reset({'-q': null, HEAD: null, '--': null, ...unstageProperties});
    return {};
  } catch (e: any) {
    return {error: e.message};
  }
}

export async function commitChanges(localPath: string, message: string) {
  const git: SimpleGit = simpleGit({baseDir: localPath});

  try {
    await git.commit(message);
    trackEvent('git/commit');
    return {};
  } catch (e: any) {
    return {error: e.message};
  }
}

export async function deleteLocalBranch(localPath: string, branchName: string) {
  const git: SimpleGit = simpleGit({baseDir: localPath});

  try {
    await git.deleteLocalBranch(branchName);
    return {};
  } catch (e: any) {
    return {error: e.message};
  }
}

export async function createLocalBranch(localPath: string, branchName: string) {
  const git: SimpleGit = simpleGit({baseDir: localPath});

  try {
    await git.checkoutLocalBranch(branchName);
    return {};
  } catch (e: any) {
    return {error: e.message};
  }
}

export async function publishLocalBranch(localPath: string, branchName: string) {
  const git: SimpleGit = simpleGit({baseDir: localPath});

  try {
    await git.push({'-u': null, origin: null, [branchName]: null});
    return {};
  } catch (e: any) {
    return {error: e.message};
  }
}

export async function pushChanges(localPath: string, branchName: string) {
  const git: SimpleGit = simpleGit({baseDir: localPath});

  try {
    await git.push('origin', branchName);
    trackEvent('git/push');
    return {};
  } catch (e: any) {
    return {error: e.message};
  }
}

export async function setRemote(localPath: string, remoteURL: string) {
  const git: SimpleGit = simpleGit({baseDir: localPath});

  try {
    await git.addRemote('origin', remoteURL);
    await git.fetch();
    return {};
  } catch (e: any) {
    return {error: e.message};
  }
}

export async function getCommitsCount(localPath: string, branchName: string) {
  const git: SimpleGit = simpleGit({baseDir: localPath});

  try {
    const [aheadCommits, behindCommits] = (
      await git.raw('rev-list', '--left-right', '--count', `${branchName}...origin/${branchName}`)
    )
      .trim()
      .split('\t');

    return {aheadCommits, behindCommits};
  } catch (e) {
    return {aheadCommits: 0, behindCommits: 0};
  }
}

export async function fetchRepo(localPath: string) {
  const git: SimpleGit = simpleGit({baseDir: localPath});

  try {
    await git.fetch();
    return {};
  } catch (e: any) {
    return {error: e.message};
  }
}

export async function pullChanges(localPath: string) {
  const git: SimpleGit = simpleGit({baseDir: localPath});

  try {
    await git.pull();
    return {};
  } catch (e: any) {
    return {error: e.message};
  }
}

export async function getCommitResources(localPath: string, commitHash: string) {
  const git: SimpleGit = simpleGit({baseDir: localPath});
  let filesContent: Record<string, string> = {};

  const filesPaths = (await git.raw('ls-tree', '-r', '--name-only', commitHash))
    .split('\n')
    .filter(
      el =>
        (el.includes('.yaml') || el.includes('.yml')) &&
        !isKustomizationFilePath(el) &&
        !isHelmTemplateFile(el) &&
        !isHelmChartFile(el) &&
        !isHelmValuesFile(el)
    );

  for (let i = 0; i < filesPaths.length; i += 1) {
    let content: string;

    // get the content of the file found in current branch
    try {
      // eslint-disable-next-line no-await-in-loop
      content = await git.show(`${commitHash}:${filesPaths[i]}`);
    } catch (e) {
      content = '';
    }

    if (content) {
      filesContent[filesPaths[i]] = content;
    }
  }

  return filesContent;
}

export async function getBranchCommits(localPath: string, branchName: string) {
  const git: SimpleGit = simpleGit({baseDir: localPath});

  try {
    const commits = [
      // eslint-disable-next-line no-await-in-loop
      ...(await git.log({[branchName]: null})).all,
    ];

    return orderBy(commits, ['date'], ['desc']);
  } catch (e) {
    return [];
  }
}
