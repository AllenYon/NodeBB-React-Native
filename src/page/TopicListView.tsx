import {
  View,
  FlatList,
  RefreshControl,
  ListRenderItem,
  Text,
} from 'react-native';
import React, {useEffect, useReducer} from 'react';

import {Topic, TopicAction, TopicState} from '../types.tsx';
import {useInfiniteQuery, useQueryClient} from '@tanstack/react-query';
import TopicItemView from '../component/TopicItemView.tsx';
import SeparatorLine from '../component/SeparatorLine.tsx';
import TopicAPI from '../service/topicAPI.tsx';
import CategoryAPI from '../service/categoryAPI.tsx';
import EmptyView from '../component/EmptyView.tsx';
import LoadingMoreView from '../component/LoadingMore.tsx';
import NoMoreDataView from '../component/NoMoreDataView.tsx';
import {useNavigation, useRoute} from '@react-navigation/native';
import CurrentAvatarView from '../component/CurrentAvatarView.tsx';

interface TopicListViewProps {
  cid?: string | number;
  title?: string | null;
}

const TopicListView: React.FC<TopicListViewProps> = props => {
  const navigation = useNavigation();
  const route = useRoute();
  const [displayData, setDisplayData] = React.useState<Topic[]>([]);
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = React.useState(false);
  const pageSize = 20;

  // @ts-ignore
  const cid = props.cid || route.params?.cid;
  // @ts-ignore
  const title = props.title || route.params?.title || '';

  // @ts-ignore
  const fetchData = async params => {
    let topics: Topic[] = [];
    if (cid === 'recent') {
      const result = await TopicAPI.getRecentTopics(params.pageParam, pageSize);
      topics = result.topics;
    } else if (cid === 'popular') {
      const result = await TopicAPI.getPopularTopics(
        params.pageParam,
        pageSize,
      );
      topics = result.topics;
    } else {
      const result = await CategoryAPI.getTopics(
        cid,
        params.pageParam,
        pageSize,
      );
      topics = result.response.topics;
    }
    // console.log('topics', topics.length);
    // //过滤已经被删除的帖子
    // topics = topics.filter(item => {
    //   return !item.deleted;
    // });
    return topics;
  };

  const {
    data,
    error,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
    status,
  } = useInfiniteQuery({
    queryKey: ['/api/v3/categories/:cid/topics/' + cid],
    queryFn: fetchData,
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages, lastPageParam) => {
      // console.log('lastPage', lastPage.length, pageSize);
      if (lastPage.length !== pageSize) {
        return undefined;
      }
      return lastPageParam + 1;
    },
  });
  // console.log('status', hasNextPage, status);

  const onRefresh = async () => {
    setRefreshing(true);
    await queryClient.invalidateQueries({
      queryKey: ['/api/v3/categories/:cid/topics/' + cid],
    });
    setRefreshing(false);
  };

  /**
   *
   * @param action upvote downvote
   * @param topic
   */
  const onClickVote = async (action: string, topic: Topic | undefined) => {
    if (topic === undefined || topic.mainPid === undefined) {
      return;
    }
    try {
      if (action === 'upvote') {
        setDisplayData(prevState => {
          return prevState.map(item => {
            if (item.tid === topic.tid) {
              item.votes++;
            }
            return item;
          });
        });
        await TopicAPI.vote(topic.mainPid, 1);
      } else if (action === 'downvote') {
        setDisplayData(prevState => {
          return prevState.map(item => {
            if (item.tid === topic.tid) {
              item.votes--;
            }
            return item;
          });
        });
        await TopicAPI.vote(topic.mainPid, -1);
      } else {
      }
    } catch (e) {
      console.error(e);
      if (action === 'upvote') {
        setDisplayData(prevState => {
          return prevState.map(item => {
            if (item.tid === topic.tid) {
              item.votes--;
            }
            return item;
          });
        });
      } else if (action === 'downvote') {
        setDisplayData(prevState => {
          return prevState.map(item => {
            if (item.tid === topic.tid) {
              item.votes++;
            }
            return item;
          });
        });
      } else {
      }
    }
  };
  const renderFooter = () => {
    if (hasNextPage) {
      if (isFetchingNextPage) {
        return <LoadingMoreView />;
      } else {
        return null;
      }
    } else {
      return <NoMoreDataView />;
    }
  };

  useEffect(() => {
    let topics = data?.pages.reduce((acc, val) => acc.concat(val), []);
    topics = topics?.filter(item => {
      return !item.deleted;
    });
    setDisplayData(topics || []);
  }, [data]);

  useEffect(() => {
    navigation.setOptions({
      title: title,
      headerRight: () => {
        return <CurrentAvatarView />;
      },
    });
  }, []);

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: 'white',
      }}>
      <FlatList
        data={displayData}
        onEndReached={() => {
          // console.log('onEndReached');
          fetchNextPage();
        }}
        onEndReachedThreshold={1}
        renderItem={props => {
          return (
            <TopicItemView
              index={props.index}
              topic={props.item}
              onClickVote={onClickVote}
            />
          );
        }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ItemSeparatorComponent={() => {
          return <SeparatorLine />;
        }}
        ListEmptyComponent={() => {
          return <EmptyView />;
        }}
        ListFooterComponent={renderFooter}
      />
    </View>
  );
};

export default TopicListView;
