import {HELM_CHART_SECTION_NAME, ROOT_FILE_ENTRY} from '@constants/constants';

import {HelmPreviewConfiguration} from '@models/appconfig';
import {HelmValuesMapType} from '@models/appstate';
import {HelmChart, HelmValuesFile} from '@models/helm';
import {SectionBlueprint} from '@models/navigator';

import {selectFile, selectHelmValuesFile, selectPreviewConfiguration} from '@redux/reducers/main';

import Colors from '@styles/Colors';

import CollapseSectionPrefix from './CollapseSectionPrefix';
import HelmChartQuickAction from './HelmChartQuickAction';
import ItemPrefix from './ItemPrefix';
import PreviewConfigurationNameSuffix from './PreviewConfigurationNameSuffix';
import PreviewConfigurationQuickAction from './PreviewConfigurationQuickAction';

export type ValuesFilesScopeType = {
  helmValuesMap: HelmValuesMapType;
  previewValuesFileId: string | undefined;
  isInClusterMode: boolean;
  isFolderOpen: boolean;
  selectedPath: string | undefined;
  [currentHelmChart: string]: HelmChart | unknown;
};

type HelmChartScopeType = {
  selectedPath: string | undefined;
  previewValuesFileId: string | undefined;
  isInClusterMode: boolean;
  [currentHelmChart: string]: HelmChart | unknown;
};

type PreviewConfigurationScopeType = {
  previewConfigurationMap: Record<string, HelmPreviewConfiguration> | undefined;
  [currentHelmChart: string]: HelmChart | unknown;
};

export function makeHelmChartSectionBlueprint(helmChart: HelmChart) {
  const previewConfigurationsSectionBlueprint: SectionBlueprint<
    HelmPreviewConfiguration,
    PreviewConfigurationScopeType
  > = {
    name: 'Preview Configurations',
    id: `${helmChart.id}-configurations`,
    containerElementId: 'helm-section-container',
    rootSectionId: HELM_CHART_SECTION_NAME,
    getScope: state => {
      return {
        previewConfigurationMap: state.config.projectConfig?.helm?.previewConfigurationMap,
        [helmChart.id]: state.main.helmChartMap[helmChart.id],
      };
    },
    builder: {
      getRawItems: scope => {
        const currentHelmChart = scope[helmChart.id] as HelmChart | undefined;
        if (!currentHelmChart) {
          return [];
        }
        return scope.previewConfigurationMap
          ? Object.values(scope.previewConfigurationMap).filter(
              pc => pc.helmChartFilePath === currentHelmChart.filePath
            )
          : [];
      },
      isInitialized: () => true,
      isVisible: () => true,
    },
    itemBlueprint: {
      getInstanceId: rawItem => rawItem.id,
      getName: rawItem => rawItem.name,
      builder: {
        getMeta: () => {
          return {
            itemPrefixStyle: {
              paddingLeft: 10,
            },
            itemPrefixIcon: 'preview',
          };
        },
      },
      instanceHandler: {
        onClick: (itemInstance, dispatch) => {
          dispatch(selectPreviewConfiguration(itemInstance.id));
        },
      },
      customization: {
        quickAction: {
          component: PreviewConfigurationQuickAction,
          options: {isVisibleOnHover: true},
        },
        prefix: {
          component: ItemPrefix,
        },
        lastItemMarginBottom: 0,
      },
    },
    customization: {
      counterDisplayMode: 'items',
      indentation: 10,
      nameWeight: 400,
      nameSize: 14,
      nameColor: Colors.grey9,
      nameHorizontalPadding: 0,
      namePrefix: {
        component: CollapseSectionPrefix,
      },
      sectionMarginBottom: 12,
      nameSuffix: {
        component: PreviewConfigurationNameSuffix,
        options: {
          isVisibleOnHover: true,
        },
      },
    },
  };

  const valuesFilesSectionBlueprint: SectionBlueprint<HelmValuesFile, ValuesFilesScopeType> = {
    name: 'Values Files',
    id: `${helmChart.id}-values`,
    containerElementId: 'helm-section-container',
    rootSectionId: HELM_CHART_SECTION_NAME,
    getScope: state => {
      const kubeConfigPath = state.config.projectConfig?.kubeConfig?.path || state.config.kubeConfig.path;
      return {
        helmValuesMap: state.main.helmValuesMap,
        isInClusterMode: kubeConfigPath
          ? Boolean(state.main.previewResourceId && state.main.previewResourceId.endsWith(kubeConfigPath))
          : false,
        previewValuesFileId: state.main.previewValuesFileId,
        isFolderOpen: Boolean(state.main.fileMap[ROOT_FILE_ENTRY]),
        selectedPath: state.main.selectedPath,
        [helmChart.id]: state.main.helmChartMap[helmChart.id],
      };
    },
    builder: {
      getRawItems: scope => {
        const currentHelmChart = scope[helmChart.id] as HelmChart | undefined;
        if (!currentHelmChart) {
          return [];
        }
        return currentHelmChart.valueFileIds
          .map(id => scope.helmValuesMap[id])
          .filter((v): v is HelmValuesFile => v !== undefined);
      },
      isInitialized: scope => {
        return scope.isFolderOpen;
      },
      isEmpty: (scope, rawItems) => {
        return scope.isFolderOpen && rawItems.length === 0;
      },
    },
    customization: {
      counterDisplayMode: 'items',
      indentation: 10,
      nameWeight: 400,
      nameSize: 14,
      nameColor: Colors.grey9,
      nameHorizontalPadding: 0,
      namePrefix: {
        component: CollapseSectionPrefix,
      },
    },
    itemBlueprint: {
      getName: rawItem => rawItem.name,
      getInstanceId: rawItem => rawItem.id,
      builder: {
        isSelected: (rawItem, scope) => {
          return rawItem.filePath === scope.selectedPath;
        },
        isDisabled: (rawItem, scope) =>
          Boolean((scope.previewValuesFileId && scope.previewValuesFileId !== rawItem.id) || scope.isInClusterMode),
        getMeta: () => {
          return {
            itemPrefixStyle: {
              paddingLeft: 10,
            },
            itemPrefixIcon: 'file',
          };
        },
      },
      instanceHandler: {
        onClick: (itemInstance, dispatch) => {
          dispatch(selectHelmValuesFile({valuesFileId: itemInstance.id}));
        },
      },
      customization: {
        quickAction: {
          component: HelmChartQuickAction,
          options: {isVisibleOnHover: true},
        },
        prefix: {
          component: ItemPrefix,
        },
        lastItemMarginBottom: 0,
      },
    },
  };

  const helmChartSectionBlueprint: SectionBlueprint<HelmChart, HelmChartScopeType> = {
    id: helmChart.id,
    name: helmChart.name,
    containerElementId: 'helm-sections-container',
    rootSectionId: HELM_CHART_SECTION_NAME,
    childSectionIds: [valuesFilesSectionBlueprint.id, previewConfigurationsSectionBlueprint.id],
    getScope: state => {
      const kubeConfigPath = state.config.projectConfig?.kubeConfig?.path || state.config.kubeConfig.path;
      return {
        isInClusterMode: kubeConfigPath
          ? Boolean(state.main.previewResourceId && state.main.previewResourceId.endsWith(kubeConfigPath))
          : false,
        previewValuesFileId: state.main.previewValuesFileId,
        selectedPath: state.main.selectedPath,
        [helmChart.id]: state.main.helmChartMap[helmChart.id],
      };
    },
    builder: {
      transformName: (_, scope) => {
        const currentHelmChart = scope[helmChart.id] as HelmChart | undefined;
        if (!currentHelmChart) {
          return 'Unnamed';
        }
        return currentHelmChart.name;
      },
      getRawItems: scope => {
        const currentHelmChart = scope[helmChart.id] as HelmChart | undefined;
        if (!currentHelmChart) {
          return [];
        }
        return [currentHelmChart];
      },
    },
    itemBlueprint: {
      getName: () => 'Chart.yaml',
      getInstanceId: chart => chart.id,
      builder: {
        getMeta: chart => ({
          filePath: chart.filePath,
          itemPrefixIcon: 'file',
        }),
        isSelected: (chart, scope) => {
          return scope.selectedPath === chart.filePath;
        },
        isDisabled: (rawItem, scope) =>
          Boolean((scope.previewValuesFileId && scope.previewValuesFileId !== rawItem.id) || scope.isInClusterMode),
      },
      instanceHandler: {
        onClick: (instance, dispatch) => {
          const filePath: string | undefined = instance.meta?.filePath;
          if (!filePath) {
            return;
          }
          dispatch(selectFile({filePath}));
        },
      },
      customization: {
        prefix: {component: ItemPrefix},
        lastItemMarginBottom: 0,
      },
    },
    customization: {
      counterDisplayMode: 'none',
      indentation: 0,
      nameWeight: 600,
      nameSize: 14,
      nameColor: Colors.grey9,
    },
  };

  return {helmChartSectionBlueprint, valuesFilesSectionBlueprint, previewConfigurationsSectionBlueprint};
}
