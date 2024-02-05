import {
  Text,
  View,
  TouchableOpacity,
  ListRenderItem,
  FlatList,
  TouchableWithoutFeedback,
} from 'react-native';
import React, {useEffect, useRef, useState, useContext} from 'react';
import {useNavigation, useRoute} from '@react-navigation/native';
import {useQuery, useQueryClient} from '@tanstack/react-query';
import PagerView from 'react-native-pager-view';
import TopicListView from './TopicListView.tsx';
import {useMMKVObject} from 'react-native-mmkv';
import {User} from '../types.tsx';
import {Avatar} from 'native-base';
import CategoryAPI from '../service/categoryAPI.tsx';

const defaultTabs = [
  {
    title: '最新',
    cid: 'recent',
    selected: false,
  },
  {
    title: '热门',
    cid: 'popular',
    selected: false,
  },
];

const HomeView = () => {
  const navigation = useNavigation();
  const [user, setUser] = useMMKVObject<User>('user');

  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = React.useState(false);
  const [tabs, setTabs] = useState(defaultTabs);
  const {isPending, isError, error, data} = useQuery({
    queryKey: ['/api/v3/categories'],
    queryFn: async () => {
      const result = await CategoryAPI.getCategories();
      return result.response.categories;
    },
  });

  const renderTabItem: ListRenderItem<any> = ({item}) => {
    return (
      <View
        style={{padding: 10, backgroundColor: item.selected ? 'red' : 'blue'}}>
        <Text>{item.title}</Text>
      </View>
    );
  };

  return (
    <View
      style={{
        flex: 1,
      }}>
      <View
        style={{
          marginTop: 44,
          flexDirection: 'row',
          paddingLeft: 12,
          paddingRight: 12,
          paddingTop: 8,
          paddingBottom: 8,
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
        <View>
          <FlatList
            style={{
              flexShrink: 0,
            }}
            horizontal={true}
            data={tabs}
            renderItem={renderTabItem}
          />
        </View>
        {user && (
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
            }}>
            {/*<Icon name={'search1'} size={20} color={'black'} />*/}
            <TouchableWithoutFeedback
              onPress={() => {
                // @ts-ignore
                navigation.navigate('Setting');
              }}>
              <Avatar
                size={'sm'}
                source={{
                  uri: user?.picture,
                }}
              />
            </TouchableWithoutFeedback>
          </View>
        )}
        {!user && (
          <TouchableOpacity
            onPress={() => {
              // @ts-ignore
              navigation.navigate('SignIn');
            }}>
            <Text>Sign In</Text>
          </TouchableOpacity>
        )}
      </View>
      <PagerView
        style={{flex: 1}}
        initialPage={0}
        onPageSelected={e => {
          console.log('onPageSelected', e.nativeEvent.position);
          const currentIndex = e.nativeEvent.position;
          const newTabs = tabs.map((tab, index) => {
            tab.selected = index === currentIndex;
            return tab;
          });
          setTabs(newTabs);
        }}>
        <TopicListView key={'0'} cid={'recent'} />
        <TopicListView key={'1'} cid={'popular'} />
      </PagerView>
    </View>
  );
};

export default HomeView;