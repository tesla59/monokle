import styled from 'styled-components';

import Colors from '@styles/Colors';

export const Container = styled.div`
  & > div:nth-child(1) {
    height: 100%;
    background-color: ${Colors.grey3b};
  }
`;
