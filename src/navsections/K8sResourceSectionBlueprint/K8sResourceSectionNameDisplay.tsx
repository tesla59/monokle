import {memo} from 'react';

import {rgba} from 'polished';
import styled from 'styled-components';

import {useAppSelector} from '@redux/hooks';
import {isInClusterModeSelector, isInPreviewModeSelectorNew, kubeConfigContextColorSelector} from '@redux/selectors';
import {activeResourceCountSelector} from '@redux/selectors/resourceMapSelectors';

import {ClusterColors} from '@shared/models/cluster';
import {BackgroundColors, Colors} from '@shared/styles/colors';

const S = {
  LocalOutputTag: styled.div`
    font-size: 12px;
    margin-bottom: 10px;
    margin-left: 16px;
    border-radius: 4px;
    padding: 0px 5px;
    color: ${Colors.grey6};
  `,
  PreviewOutputTag: styled.div`
    font-size: 12px;
    margin-bottom: 10px;
    margin-left: 20px;
    border-radius: 4px;
    padding: 0px 5px;
    color: ${BackgroundColors.previewModeBackground};
    background: ${rgba(BackgroundColors.previewModeBackground, 0.2)};
  `,
  ClusterOutputTag: styled.div<{$kubeConfigContextColor: ClusterColors}>`
    font-size: 12px;
    margin-bottom: 10px;
    margin-left: 20px;
    border-radius: 4px;
    padding: 0px 5px;

    ${({$kubeConfigContextColor}) => `
      color: ${$kubeConfigContextColor || Colors.volcano8};
      background: ${rgba($kubeConfigContextColor || Colors.volcano8, 0.2)};
    `}
  `,
  Bold: styled.span`
    font-weight: 800;
  `,
};

function K8sResourceSectionNameDisplay() {
  const isInClusterMode = useAppSelector(isInClusterModeSelector);
  const isInPreviewMode = useAppSelector(isInPreviewModeSelectorNew);
  const kubeConfigContextColor = useAppSelector(kubeConfigContextColorSelector);
  const currentContext = useAppSelector(state => state.main.clusterConnection?.context);
  const previewType = useAppSelector(state => state.main.preview?.type);
  const activeResourceCount = useAppSelector(activeResourceCountSelector);

  if (isInClusterMode) {
    return (
      <S.ClusterOutputTag $kubeConfigContextColor={kubeConfigContextColor}>
        <S.Bold>{activeResourceCount} resources</S.Bold> found in <S.Bold>{currentContext}</S.Bold>
      </S.ClusterOutputTag>
    );
  }

  if (isInPreviewMode) {
    return (
      <S.PreviewOutputTag>
        <S.Bold>{activeResourceCount} resources</S.Bold> generated by the <S.Bold>{previewType} preview</S.Bold>
      </S.PreviewOutputTag>
    );
  }

  return (
    <S.LocalOutputTag>
      <S.Bold>{activeResourceCount} resources</S.Bold> found in your <S.Bold>files</S.Bold>
    </S.LocalOutputTag>
  );
}

export default memo(K8sResourceSectionNameDisplay);
