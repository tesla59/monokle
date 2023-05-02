import styled from 'styled-components';

import {useAppDispatch, useAppSelector} from '@redux/hooks';
import {openReplaceImageModal} from '@redux/reducers/ui';

import {Colors} from '@shared/styles/colors';
import {isInClusterModeSelector, isInPreviewModeSelector} from '@shared/utils/selectors';

type IProps = {
  id: string;
  isSelected: boolean;
};

const ImageQuickAction: React.FC<IProps> = props => {
  const {id, isSelected} = props;

  const dispatch = useAppDispatch();
  const isInPreviewMode = useAppSelector(isInPreviewModeSelector);
  const isInClusterMode = useAppSelector(isInClusterModeSelector);

  const onReplaceHandler = () => {
    if (isInPreviewMode || isInClusterMode) {
      return;
    }

    dispatch(openReplaceImageModal(id));
  };

  return (
    <ReplaceSpan $isDisabled={isInPreviewMode || isInClusterMode} $isSelected={isSelected} onClick={onReplaceHandler}>
      Replace
    </ReplaceSpan>
  );
};

export default ImageQuickAction;

// Styled Components

export const ReplaceSpan = styled.span<{$isDisabled: boolean; $isSelected: boolean}>`
  font-weight: 500;
  font-size: 12px;
  margin: 0 15px 0 auto;
  color: ${({$isDisabled, $isSelected}) =>
    $isSelected ? Colors.blackPure : $isDisabled ? Colors.grey6 : Colors.blue6};
  cursor: ${({$isDisabled}) => ($isDisabled ? 'not-allowed' : 'pointer')};
`;
