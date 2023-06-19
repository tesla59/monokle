import {sep} from 'path';

import {PREDEFINED_K8S_VERSION} from './k8s';

export const electronStoreSchema = {
  main: {
    type: 'object',
    properties: {
      resourceRefsProcessingOptions: {
        type: 'object',
        properties: {
          shouldIgnoreOptionalUnsatisfiedRefs: {
            type: 'boolean',
          },
        },
      },
      deviceID: {
        type: 'string',
      },
      firstTimeRunTimestamp: {
        type: 'number',
      },
      filtersPresets: {
        type: 'object',
      },
    },
  },
  appConfig: {
    type: 'object',
    properties: {
      userApiKeys: {
        type: 'object',
        properties: {
          OPENAI: {
            type: 'string',
          },
        },
      },
      kubeConfigContextsColors: {
        type: 'object',
      },
      lastNamespaceLoaded: {
        type: 'string',
      },
      hasDeletedDefaultTemplatesPlugin: {
        type: 'boolean',
      },
      lastSeenReleaseNotesVersion: {
        type: 'string',
      },
      lastSessionVersion: {
        type: 'string',
      },
      useKubectlProxy: {
        type: 'boolean',
      },
      loadLastProjectOnStartup: {
        type: 'boolean',
      },
      fileExplorerSortOrder: {
        type: 'string',
      },
      scanExcludes: {
        type: 'array',
        items: {
          type: 'string',
        },
      },
      fileIncludes: {
        type: 'array',
        items: {
          type: 'string',
        },
      },
      settings: {
        type: 'object',
        properties: {
          theme: {
            type: 'string',
          },
          textSize: {
            type: 'string',
          },
          language: {
            type: 'string',
          },
          helmPreviewMode: {
            type: 'string',
          },
          kustomizeCommand: {
            type: 'string',
          },
          hideExcludedFilesInFileExplorer: {
            type: 'boolean',
          },
          hideUnsupportedFilesInFileExplorer: {
            type: 'boolean',
          },
          enableHelmWithKustomize: {
            type: 'boolean',
          },
          createDefaultObjects: {
            type: 'boolean',
          },
          setDefaultPrimitiveValues: {
            type: 'boolean',
          },
          allowEditInClusterMode: {
            type: 'boolean',
          },
        },
      },
      recentFolders: {
        type: 'array',
        items: {
          type: 'string',
        },
      },
      newVersion: {
        type: 'number',
      },
      k8sVersion: {
        type: 'string',
      },
      projects: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
            },
            rootFolder: {
              type: 'string',
            },
            k8sVersion: {
              type: 'string',
            },
            lastOpened: {
              type: 'string',
            },
          },
        },
      },
      projectsRootFolder: {
        type: 'string',
      },
      favoriteTemplates: {
        type: 'array',
      },
      disableEventTracking: {
        type: 'boolean',
      },
      disableErrorReporting: {
        type: 'boolean',
      },
    },
  },
  ui: {
    type: 'object',
    properties: {
      isSettingsOpen: {
        type: 'boolean',
      },
      isNotificationsOpen: {
        type: 'boolean',
      },
      isNewResourceWizardOpen: {
        type: 'boolean',
      },
      isFolderLoading: {
        type: 'boolean',
      },
      showOpenProjectPopup: {
        type: 'boolean',
      },
      leftMenu: {
        type: 'object',
        properties: {
          bottomSelection: {
            type: ['string', 'null'],
          },
          selection: {
            type: 'string',
          },
          isActive: {
            type: 'boolean',
          },
        },
      },
      rightMenu: {
        type: 'object',
        properties: {
          selection: {
            type: 'string',
          },
          isActive: {
            type: 'boolean',
          },
        },
      },
      paneConfiguration: {
        type: 'object',
        properties: {
          leftWidth: {
            type: 'number',
          },
          navWidth: {
            type: 'number',
          },
          editWidth: {
            type: 'number',
          },
          rightWidth: {
            type: 'number',
          },
        },
      },
      zoomFactor: {
        type: 'number',
      },
    },
  },
  validation: {
    type: 'object',
    properties: {
      config: {
        type: 'object',
      },
      rules: {
        type: 'object',
      },
      settings: {
        type: 'object',
      },
    },
  },
  uiCoach: {
    type: 'object',
    properties: {
      hasUserPerformedClickOnClusterIcon: {
        type: 'boolean',
      },
    },
  },
  kubeConfig: {
    type: 'object',
    properties: {
      namespaces: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            namespaceName: {
              type: 'string',
            },
            clusterName: {
              type: 'string',
            },
          },
        },
      },
      contextsWithRemovedNamespace: {
        type: 'array',
        items: {
          type: 'string',
        },
      },
    },
  },
  terminal: {
    type: 'object',
    properties: {
      settings: {
        type: 'object',
        properties: {
          defaultShell: {
            type: 'string',
          },
          fontSize: {
            type: 'number',
          },
        },
      },
    },
  },
};

export const electronStoreDefaults = {
  main: {
    filtersPresets: {},
  },
  appConfig: {
    userApiKeys: {},
    kubeConfigContextsColors: {},
    lastNamespaceLoaded: 'default',
    useKubectlProxy: false,
    loadLastProjectOnStartup: false,
    fileExplorerSortOrder: 'folders',
    scanExcludes: ['node_modules', '**/.git', '**/pkg/mod/**', '**/.kube', '**/*.swp', `${sep}.github`],
    fileIncludes: ['*.yaml', '*.yml'],
    settings: {
      theme: 'dark',
      textSize: 'medium',
      language: 'en',
      helmPreviewMode: 'template',
      createDefaultObjects: false,
      setDefaultPrimitiveValues: true,
      allowEditInClusterMode: true,
      enableHelmWithKustomize: true,
    },
    recentFolders: [],
    newVersion: 0,
    k8sVersion: PREDEFINED_K8S_VERSION,
    hasDeletedDefaultTemplatesPlugin: false,
  },
  ui: {
    isSettingsOpen: false,
    isNewResourceWizardOpen: false,
    showOpenProjectPopup: true,
    leftMenu: {
      bottomSelection: null,
      selection: 'explorer',
      isActive: true,
    },
    rightMenu: {
      selection: '',
      isActive: false,
    },
    paneConfiguration: {
      leftWidth: 0.3333,
      navWidth: 0.3333,
      editWidth: 0.3333,
      rightWidth: 0,
    },
    zoomFactor: 1,
  },
  kubeConfig: {
    namespaces: [],
    contextsWithRemovedNamespace: [],
  },
  terminal: {
    settings: {
      defaultShell: '',
      fontSize: 14,
    },
  },
};
