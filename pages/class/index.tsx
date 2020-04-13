import { GetStaticProps } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import React from 'react';
import Select, { OptionsType, ValueType } from 'react-select';
import styled from 'styled-components';
import { fetchClassList } from '../../api/contentful/class';
import { ClassList } from '../../components/class/ClassList';
import { Container } from '../../components/Container';
import { Ogp } from '../../components/Ogp';
import { SectionTitle } from '../../components/SectionTitle';
import { ExtractPromise } from '../../utils/return-type';

const FilterContainer = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 0.8em;
  flex-wrap: wrap;
`;

const SelectContainer = styled.div`
  width: 100%;
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;

  .hour {
    min-width: 8em;
  }
  .tags {
    flex-grow: 1;
  }
`;

const ClearLink = styled.a`
  margin-left: 10px;
  word-break: keep-all;
`;

type Props = {
  classes: ExtractPromise<ReturnType<typeof fetchClassList>>;
  hours: Array<{ day: string; time: number }>;
  tags: string[];
};
type TimeOptionType = {
  label: string;
  value: { day: string; time: number };
};
type TagsOptionType = {
  label: string;
  value: string;
};
export default ({ classes, hours, tags }: Props) => {
  const router = useRouter();
  const [hourFilter, setHourFilter] = React.useState<{
    day: string;
    time: number;
  } | null>(null);
  const [tagFilter, setTagFilter] = React.useState<string[]>([]);

  React.useEffect(() => {
    const asPath = decodeURIComponent(router.asPath);
    if (asPath.match(/[#&]filter=(\w+)-(\d+)/g)) {
      setHourFilter({
        day: RegExp.$1,
        time: Number(RegExp.$2),
      });
    }
    if (asPath.match(/[#&]tags=(.+)/g)) {
      const filter = RegExp.$1?.split(',') || [];
      setTagFilter(filter.filter((item) => tags.includes(item)));
    }
  }, [router, router.asPath]);

  const filteredClasses = React.useMemo(() => {
    if (!hourFilter && tagFilter.length === 0) return classes;

    return classes.filter(
      ({ day, time, tags }) =>
        (!hourFilter || (day === hourFilter.day && time === hourFilter.time)) &&
        (tagFilter.length === 0 || tagFilter.some((tag) => tags.includes(tag))),
    );
  }, [hourFilter, tagFilter]);

  const hourSelectOptions: OptionsType<TimeOptionType> = hours.map((hour) => ({
    value: hour,
    label: `${hour.day}曜${hour.time}限`,
  }));

  const tagSelectOptions: OptionsType<TagsOptionType> = tags.map((tag) => ({
    value: tag,
    label: tag,
  }));

  const hourSelectedOptions: TimeOptionType | null = hourFilter
    ? {
        value: hourFilter,
        label: `${hourFilter.day}曜${hourFilter.time}限`,
      }
    : null;

  const tagSelectedOptions: OptionsType<TagsOptionType> = tagFilter.map(
    (tag) => ({
      value: tag,
      label: tag,
    }),
  );

  const handleHourSelectChange = React.useCallback(
    (options: ValueType<TimeOptionType>) => {
      // if (options) setCategoryFilter([(options as OptionType).value]);
      if (options) {
        const filter = (options as TimeOptionType).value;

        setHourFilter(filter);
        router.replace({
          pathname: router.pathname,
          hash: `filter=${filter.day}-${filter.time}&tags=${tagFilter.join(
            ',',
          )}`,
        });
      }
    },
    [router.pathname],
  );

  const handleTagSelectChange = React.useCallback(
    (options: ValueType<TagsOptionType>) => {
      // if (options) setCategoryFilter([(options as OptionType).value]);
      if (options) {
        const filter = (options as OptionsType<TagsOptionType>).map(
          ({ value }) => value,
        );

        setTagFilter(filter);
        router.replace({
          pathname: router.pathname,
          hash: hourFilter
            ? `filter=${hourFilter.day}-${hourFilter.time}&tags=${filter.join(
                ',',
              )}`
            : `tags=${filter.join(',')}`,
        });
      }
    },
    [router.pathname],
  );

  const handleClearFilter = React.useCallback(
    (e: React.SyntheticEvent) => {
      setHourFilter(null);
      setTagFilter([]);
      router.replace({
        pathname: router.pathname,
        hash: null,
      });
      e.preventDefault();

      return false;
    },
    [setHourFilter],
  );
  return (
    <>
      <Head>
        <title>授業の案内</title>
        <Ogp
          title={`授業の案内`}
          description={'授業の内容や感想を紹介します'}
        />
      </Head>
      <Container>
        <section>
          <SectionTitle>授業の選択について</SectionTitle>
          <p>
            ・共同化科目は、全ての科目に「大学ごとの」定員があり、抽選で履修者を決定します。
          </p>
          <p>
            ・抽選では、第5希望まで申し込むことができますが、人気の科目は履修者が集中するので、すべての科目で落選する場合があります。
            その場合は、その時間の科目を履修しないか、受講登録修正期間に空き定員のある授業に登録することになります。
          </p>
          <p>
            ・卒業認定に必要な単位数が、科目分類ごとに指定されている大学もあります。(科目分類：人と自然、人と文化、人と社会etc…)
          </p>
        </section>
        <section>
          <SectionTitle>授業一覧</SectionTitle>
          <FilterContainer>
            <SelectContainer>
              <Select
                options={hourSelectOptions}
                onChange={handleHourSelectChange}
                value={hourSelectedOptions}
                placeholder='時限'
                className='hour'
              />
              <Select
                options={tagSelectOptions}
                onChange={handleTagSelectChange}
                value={tagSelectedOptions}
                placeholder='タグで絞り込み'
                isMulti
                className='tags'
              />
            </SelectContainer>
            {(hourFilter || tagFilter.length > 0) && (
              <ClearLink onClick={handleClearFilter} href='#'>
                絞り込み解除
              </ClearLink>
            )}
          </FilterContainer>
          <ClassList classes={filteredClasses} />
        </section>
      </Container>
    </>
  );
};

export const getStaticProps: GetStaticProps<Props> = async () => {
  const classes = await fetchClassList();

  return {
    props: {
      classes,
      hours: Object.values(
        classes.reduce<Record<string, { day: string; time: number }>>(
          (obj, { day, time }) => ({
            ...obj,
            [`${day}-${time}`]: { day, time },
          }),
          {},
        ),
      ),
      tags: Object.keys(
        classes.reduce<Record<string, number>>(
          (obj, { tags }) =>
            tags.reduce(
              (obj2, tag) => ({
                ...obj2,
                [tag]: 1,
              }),
              obj,
            ),
          {},
        ),
      ),
    },
  };
};
