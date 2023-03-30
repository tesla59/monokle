import {memo, useEffect, useLayoutEffect, useRef} from 'react';
import {useMeasure} from 'react-use';

import {DataNode} from 'antd/lib/tree';

import {isString} from 'lodash';
import path from 'path';

import {useAppDispatch, useAppSelector} from '@redux/hooks';
import {selectFile} from '@redux/reducers/main';
import {setFileExplorerExpandedFolders} from '@redux/reducers/ui';
import {selectedFilePathSelector} from '@redux/selectors';

import {getAllParentFolderPaths, isFileEntryDisabled} from '@utils/files';
import {useSelectorWithRef} from '@utils/hooks';

import {ROOT_FILE_ENTRY} from '@shared/constants/fileEntry';
import {FileMapType} from '@shared/models/appState';
import {FileExplorerSortOrder} from '@shared/models/config';
import {isFileSelection} from '@shared/models/selection';
import {isDefined} from '@shared/utils/filter';
import {isEqual} from '@shared/utils/isEqual';

import * as S from './FileSystemTree.styled';
import FileSystemTreeNode from './TreeNode';

const FileSystemTree: React.FC = () => {
  const dispatch = useAppDispatch();
  const [fileExplorerExpandedFolders, fileExplorerExpandedFoldersRef] = useSelectorWithRef(
    state => state.ui.fileExplorerExpandedFolders
  );
  const selectedFilePath = useAppSelector(selectedFilePathSelector);
  const firstHighlightedFile = useAppSelector(state => state.main.highlights.find(isFileSelection));

  const [containerRef, {height: containerHeight}] = useMeasure<HTMLDivElement>();

  const treeRef = useRef<any>(null);

  const treeData = useAppSelector(state => {
    const rootEntry = state.main.fileMap[ROOT_FILE_ENTRY];

    const rootFileNodes = createFileNodes(path.sep, state.main.fileMap);
    const rootFolderNodes =
      rootEntry?.children
        ?.map(folderPath =>
          createFolderTree(`${path.sep}${folderPath}`, state.main.fileMap, state.config.fileExplorerSortOrder)
        )
        .filter(isDefined) || [];

    return sortNodes(rootFolderNodes, rootFileNodes, state.config.fileExplorerSortOrder);
  }, isEqual);

  useEffect(() => {
    if (!firstHighlightedFile) {
      return;
    }

    const parentFolderPaths = getAllParentFolderPaths(firstHighlightedFile.filePath);
    dispatch(
      setFileExplorerExpandedFolders([...new Set([...fileExplorerExpandedFoldersRef.current, ...parentFolderPaths])])
    );
  }, [dispatch, fileExplorerExpandedFoldersRef, firstHighlightedFile]);

  useLayoutEffect(() => {
    if (!firstHighlightedFile) {
      return;
    }
    treeRef.current?.scrollTo({key: firstHighlightedFile.filePath});
  }, [firstHighlightedFile]);

  return (
    <S.TreeContainer ref={containerRef}>
      <S.TreeDirectoryTree
        $isHighlightSelection={Boolean(firstHighlightedFile)}
        ref={treeRef}
        expandedKeys={fileExplorerExpandedFolders}
        onExpand={(keys, info) => {
          dispatch(
            setFileExplorerExpandedFolders(
              keys.filter(
                key => isString(key) && (info.expanded === true ? true : !key.startsWith(info.node.key as string))
              ) as string[]
            )
          );
        }}
        treeData={treeData}
        height={containerHeight}
        titleRender={node => <FileSystemTreeNode node={node} />}
        selectedKeys={
          selectedFilePath ? [selectedFilePath] : firstHighlightedFile ? [firstHighlightedFile.filePath] : []
        }
        showIcon
        showLine={{showLeafIcon: false}}
        virtual
        onClick={(mouseEvent, nodeEvent) => {
          mouseEvent.preventDefault();
          if (nodeEvent.selectable === false) {
            return;
          }
          if (typeof nodeEvent.key === 'string' && !nodeEvent.disabled) {
            dispatch(selectFile({filePath: nodeEvent.key}));
          }
        }}
      />
    </S.TreeContainer>
  );
};

const sortNodes = (folderNodes: DataNode[], fileNodes: DataNode[], fileExplorerSortOrder: FileExplorerSortOrder) => {
  if (fileExplorerSortOrder === 'folders') {
    return [...folderNodes, ...fileNodes];
  }

  if (fileExplorerSortOrder === 'files') {
    return [...fileNodes, ...folderNodes];
  }

  return [...folderNodes, ...fileNodes].sort((a, b) => a.key.toLocaleString().localeCompare(b.key.toLocaleString()));
};

function createFileNodes(folderPath: string, fileMap: FileMapType) {
  const fileEntries = Object.values(fileMap).filter(entry => {
    const entryFolderPath = path.dirname(entry.filePath);
    return folderPath === entryFolderPath && !isDefined(entry.children);
  });

  const fileNodes: DataNode[] = fileEntries.map(entry => ({
    key: entry.filePath,
    title: path.basename(entry.filePath),
    isLeaf: true,
    disabled: isFileEntryDisabled(entry),
  }));

  return fileNodes;
}

function createFolderTree(folderPath: string, fileMap: FileMapType, fileExplorerSortOrder: FileExplorerSortOrder) {
  const folderEntry = fileMap[folderPath];
  if (!folderEntry || !isDefined(folderEntry.children)) {
    return undefined;
  }

  const fileNodes = createFileNodes(folderPath, fileMap);
  const folderNodes =
    folderEntry.children
      ?.map(childPath => createFolderTree(path.join(folderPath, childPath), fileMap, fileExplorerSortOrder))
      .filter(isDefined) || [];

  let children: DataNode[] = sortNodes(folderNodes, fileNodes, fileExplorerSortOrder);

  const treeNode: DataNode = {
    key: folderEntry.filePath,
    title: path.basename(folderEntry.filePath),
    children,
    selectable: false,
  };

  return treeNode;
}

export default memo(FileSystemTree);
