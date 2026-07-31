import React, {useEffect, useState} from 'react';
import {StyleSheet, useWindowDimensions, View} from 'react-native';

import {BottomTabBar} from '../components/BottomTabBar';
import {mainTabs} from '../constants/navigation';
import {AuthFlow} from '../features/auth';
import {getCourseDetail, type CourseDetail, type CourseLesson} from '../api/course';
import {startLearning, type LearningRecord} from '../api/learning';
import {updateUserProfile, type UpdateProfileParams} from '../api/user';
import {CourseDetailScreen} from '../features/course/screens/CourseDetailScreen';
import {LearningScreen as LessonLearningScreen} from '../features/course/screens/LearningScreen';
import {LearningScreen} from '../features/learning/screens/LearningScreen';
import {GameHomeScreen} from '../features/game/screens/GameHomeScreen';
import {GamePlayScreen} from '../features/game/screens/GamePlayScreen';
import {LanguageIslandScreen} from '../features/game/screens/LanguageIslandScreen';
import {LearningCenterScreen} from '../features/game/screens/LearningCenterScreen';
import {AIWorldUnderstandingScreen} from '../features/game/screens/AIWorldUnderstandingScreen';
import {CreativeImageStudioScreen} from '../features/game/screens/CreativeImageStudioScreen';
import {ModuleScreen} from '../features/game/screens/ModuleScreen';
import {TaskScreen} from '../features/game/screens/TaskScreen';
import {gameTasks} from '../features/game/config/gameConfig';
import {gameEventSyncService} from '../features/game/services/GameEventSyncService';
import {offlineTaskManager} from '../features/game/storage/OfflineTaskManager';
import type {GameModule, GameTask} from '../features/game/types/game';
import {
  CommunityScreen,
  type CommunityModule,
} from '../features/community/screens/CommunityScreen';
import {AIChallengeScreen} from '../pages/AIChallenge/AIChallengeScreen';
import {MineScreen} from '../features/mine/screens/MineScreen';
import {ProfileEditScreen} from '../features/mine/screens/ProfileEditScreen';
import {toLocalAvatarId} from '../features/mine/profileAvatars';
import {GrowthScreen} from '../features/growth/GrowthScreen';
import {MentorProfileScreen} from '../features/mentor/MentorProfileScreen';
import {userStore} from '../store/userStore';
import {HomeScreen} from '../screens/HomeScreen';
import {PlaceholderScreen} from '../screens/PlaceholderScreen';
import {spacing} from '../shared/theme/tokens';
import type {MainTab} from '../types/navigation';

type GameModuleOrigin = 'explore' | 'gameHome';

export function AppNavigator(): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<MainTab>('home');
  const [communityModule, setCommunityModule] =
    useState<CommunityModule>('community');
  const [route, setRoute] = useState<
    | {name: 'tabs'}
    | {name: 'detail'; courseId: number}
    | {
        name: 'learning';
        detail: CourseDetail;
        lesson: CourseLesson;
        record: LearningRecord;
      }
    | {name: 'gameHome'}
    | {name: 'gameModule'; module: GameModule; origin: GameModuleOrigin}
    | {
        name: 'gameTask';
        module: GameModule;
        task: GameTask;
        origin: GameModuleOrigin;
      }
    | {
        name: 'gamePlay';
        module: GameModule;
        task: GameTask;
        origin: GameModuleOrigin;
      }
    | {name: 'learningCenter'}
    | {name: 'aiChallenge'}
    | {name: 'growth'}
    | {name: 'mentorProfile'}
    | {name: 'profileEdit'}
  >({name: 'tabs'});
  const [, setStoreVersion] = useState(0);
  const {width} = useWindowDimensions();
  const compact = width < 360;
  const wide = width >= 680;
  const activeLabel = mainTabs.find(tab => tab.id === activeTab)?.label ?? '';

  useEffect(() => {
    const unsubscribe = userStore.subscribe(() =>
      setStoreVersion(version => version + 1),
    );
    return unsubscribe;
  }, []);

  const currentUserId = userStore.userInfo?.id;
  useEffect(() => {
    if (!currentUserId) return;
    const stopTaskUpdates = offlineTaskManager.start();
    const stopEventSync = gameEventSyncService.start(currentUserId);
    return () => {
      stopTaskUpdates();
      stopEventSync();
    };
  }, [currentUserId]);

  const handleLoginSuccess = (): void => {
    setActiveTab('home');
  };

  const handleLogout = async (): Promise<void> => {
    await userStore.logout();
    setRoute({name: 'tabs'});
  };

  const handleProfileSave = async (params: UpdateProfileParams): Promise<void> => {
    const updatedUser = await updateUserProfile(params);
    await userStore.updateProfile(params.localAvatarUri
      ? {...updatedUser, avatar: toLocalAvatarId(params.localAvatarUri)}
      : updatedUser);
    setRoute({name: 'tabs'});
  };

  const openLesson = async (
    detail: CourseDetail,
    lesson: CourseLesson,
  ): Promise<void> => {
    const record = await startLearning(detail.course.id, lesson.id);
    setRoute({name: 'learning', detail, lesson, record});
  };

  const openGameModule = (
    module: GameModule,
    origin: GameModuleOrigin,
  ): void => {
    const directTask = module.id === 'math'
      ? gameTasks.find(task => task.id === 'math.prediction.v1')
      : undefined;
    setRoute(directTask
      ? {name: 'gamePlay', module, task: directTask, origin}
      : {name: 'gameModule', module, origin});
  };

  if (!userStore.isLoggedIn || !userStore.userInfo) {
    return <AuthFlow onLoginSuccess={handleLoginSuccess} />;
  }

  if (route.name === 'detail') {
    return (
      <View style={[styles.page, wide && styles.pageWide]}>
        <CourseDetailScreen
          courseId={route.courseId}
          onBack={() => setRoute({name: 'tabs'})}
          onLessonPress={openLesson}
        />
      </View>
    );
  }

  if (route.name === 'learning') {
    const lessonIndex = route.detail.lessons.findIndex(
      item => item.id === route.lesson.id,
    );
    const nextLesson = route.detail.lessons[lessonIndex + 1];
    return (
      <View style={[styles.page, wide && styles.pageWide]}>
        <LessonLearningScreen
          course={route.detail.course}
          lesson={route.lesson}
          nextLesson={nextLesson}
          initialRecord={route.record}
          onBack={() =>
            setRoute({name: 'detail', courseId: route.detail.course.id})
          }
          onNextLesson={lesson =>
            openLesson(route.detail, lesson).catch(() => undefined)
          }
        />
      </View>
    );
  }

  if (route.name === 'gameHome') {
    return (
      <View style={[styles.page, wide && styles.pageWide]}>
        <GameHomeScreen
          onBack={() => setRoute({name: 'tabs'})}
          onOpenLearningCenter={() => setRoute({name: 'learningCenter'})}
          onModulePress={module => openGameModule(module, 'gameHome')}
        />
      </View>
    );
  }

  if (route.name === 'learningCenter') {
    return (
      <View style={[styles.page, wide && styles.pageWide]}>
        <LearningCenterScreen onBack={() => setRoute({name: 'gameHome'})} />
      </View>
    );
  }

  if (route.name === 'gameModule') {
    const returnToOrigin = (): void =>
      setRoute(
        route.origin === 'explore' ? {name: 'tabs'} : {name: 'gameHome'},
      );
    if (route.module.id === 'language') {
      return (
        <View style={[styles.page, wide && styles.pageWide]}>
          <LanguageIslandScreen onBack={returnToOrigin} />
        </View>
      );
    }
    if (route.module.id === 'science') {
      return (
        <View style={[styles.page, wide && styles.pageWide]}>
          <AIWorldUnderstandingScreen onBack={returnToOrigin} />
        </View>
      );
    }
    if (route.module.id === 'creative') {
      return (
        <View style={[styles.page, wide && styles.pageWide]}>
          <CreativeImageStudioScreen onBack={returnToOrigin} />
        </View>
      );
    }
    return (
      <View style={[styles.page, wide && styles.pageWide]}>
        <ModuleScreen
          module={route.module}
          onBack={returnToOrigin}
          onTaskPress={task =>
            setRoute({
              name: 'gameTask',
              module: route.module,
              task,
              origin: route.origin,
            })
          }
        />
      </View>
    );
  }

  if (route.name === 'gameTask') {
    return (
      <View style={[styles.page, wide && styles.pageWide]}>
        <TaskScreen
          module={route.module}
          task={route.task}
          onBack={() =>
            setRoute({
              name: 'gameModule',
              module: route.module,
              origin: route.origin,
            })
          }
          onStart={() =>
            setRoute({
              name: 'gamePlay',
              module: route.module,
              task: route.task,
              origin: route.origin,
            })
          }
        />
      </View>
    );
  }

  if (route.name === 'gamePlay') {
    return (
      <View style={[styles.page, wide && styles.pageWide]}>
        <GamePlayScreen
          task={route.task}
          onBack={() =>
            setRoute(route.module.id === 'math'
              ? route.origin === 'explore' ? {name: 'tabs'} : {name: 'gameHome'}
              : {
                name: 'gameTask',
                module: route.module,
                task: route.task,
                origin: route.origin,
              })
          }
          onComplete={() =>
            setRoute(route.module.id === 'math'
              ? route.origin === 'explore' ? {name: 'tabs'} : {name: 'gameHome'}
              : {
                name: 'gameModule',
                module: route.module,
                origin: route.origin,
              })
          }
        />
      </View>
    );
  }

  if (route.name === 'aiChallenge') {
    return (
      <View style={[styles.page, wide && styles.pageWide]}>
        <AIChallengeScreen onBack={() => setRoute({name: 'tabs'})} />
      </View>
    );
  }

  if (route.name === 'growth') {
    return (
      <View style={[styles.page, wide && styles.pageWide]}>
        <GrowthScreen
          onBack={() => setRoute({name: 'tabs'})}
          onOpenMentorProfile={() => setRoute({name: 'mentorProfile'})}
        />
      </View>
    );
  }

  if (route.name === 'mentorProfile') {
    return (
      <View style={[styles.page, wide && styles.pageWide]}>
        <MentorProfileScreen onBack={() => setRoute({name: 'growth'})} />
      </View>
    );
  }

  if (route.name === 'profileEdit') {
    return (
      <View style={[styles.page, wide && styles.pageWide]}>
        <ProfileEditScreen
          onBack={() => setRoute({name: 'tabs'})}
          onSave={handleProfileSave}
          userInfo={userStore.userInfo}
        />
      </View>
    );
  }

  return (
    <View style={[styles.page, wide && styles.pageWide]}>
      {activeTab === 'home' ? (
        <HomeScreen
          compact={compact}
          wide={wide}
          onCoursePress={courseId => setRoute({name: 'detail', courseId})}
          onContinueLearning={(courseId, lessonId) => {
            void getCourseDetail(courseId).then(detail => {
              const lesson = detail.lessons.find(item => item.id === lessonId) ?? detail.lessons[0];
              if (lesson) void openLesson(detail, lesson);
            }).catch(() => undefined);
          }}
        />
      ) : activeTab === 'learn' ? (
        <LearningScreen
          onCoursePress={courseId => setRoute({name: 'detail', courseId})}
          onContinueLearning={(item, detail) => {
            const lesson = detail.lessons.find(
              candidate => candidate.id === item.record.lessonId,
            );
            if (lesson)
              setRoute({name: 'learning', detail, lesson, record: item.record});
          }}
        />
      ) : activeTab === 'community' ? (
        <CommunityScreen
          activeModule={communityModule}
          onActiveModuleChange={setCommunityModule}
          onOpenAiChallenge={() => setRoute({name: 'aiChallenge'})}
          onOpenModule={module => {
            setCommunityModule('explore');
            openGameModule(module, 'explore');
          }}
        />
      ) : activeTab === 'profile' ? (
        <MineScreen
          onLogout={handleLogout}
          onOpenGrowth={() => setRoute({name: 'growth'})}
          onOpenProfileEdit={() => setRoute({name: 'profileEdit'})}
          userInfo={userStore.userInfo}
        />
      ) : (
        <PlaceholderScreen title={activeLabel} />
      )}
      <BottomTabBar activeTab={activeTab} onTabPress={setActiveTab} />
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    width: '100%',
    maxWidth: 720,
    alignSelf: 'center',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
  },
  pageWide: {
    paddingHorizontal: spacing.xl,
  },
});
