import styled from 'styled-components';

export const Container = styled.div`
  margin: auto;
  width: 80%;
  max-width: 800px;
  overflow-x: auto;

  @media screen and (max-width: 520px) {
    width: 95%;
  }
`;
