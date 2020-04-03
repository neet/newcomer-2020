import styled from 'styled-components';

const Container = styled.ul`
  list-style: none;
  margin: 0.5em;
  padding: 0;
  display: flex;
  flex-direction: row;
`;

const Item = styled.li`
  padding: 2px 16px;
  margin: 0 5px;
  background-color: #eee;
  border-radius: 1em;
  border: 1px solid transparent;
`;

type Props = { data: string[] };
export const CategoryList = ({ data }: Props) => {
  return (
    <Container>
      {data.map((item) => (
        <Item key={item}>{item}</Item>
      ))}
    </Container>
  );
};