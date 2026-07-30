import type {AxiosError} from 'axios';

import http from './http';

export type Course = {
  id: number;
  title: string;
  coverUrl: string | null;
  description: string;
  category: string;
  level: string;
  duration: string;
  teacherName: string;
  viewCount: number;
  createTime: string;
};

export type CourseLesson = {
  id: number;
  courseId: number;
  title: string;
  videoUrl: string | null;
  duration: string;
  sort: number;
  createTime: string;
};

export type CourseDetail = {
  course: Course;
  lessons: CourseLesson[];
};

type ApiResponse<T> = {code: number; message: string; data: T};
type PartialCourseDetail = {course?: Course; lessons?: CourseLesson[]};

function isCourse(value: unknown): value is Course {
  return typeof value === 'object' && value !== null
    && typeof (value as {id?: unknown}).id === 'number'
    && typeof (value as {title?: unknown}).title === 'string';
}

export class CourseApiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CourseApiError';
  }
}

async function requestCourses(path: string): Promise<Course[]> {
  try {
    const response = await http.get<ApiResponse<Course[]>>(path);
    if (response.data.code !== 200) {
      throw new CourseApiError(response.data.message || '课程加载失败，请稍后重试。');
    }
    return response.data.data;
  } catch (error) {
    if (error instanceof CourseApiError) {
      throw error;
    }
    const axiosError = error as AxiosError<ApiResponse<unknown>>;
    throw new CourseApiError(axiosError.response?.data?.message || '课程加载失败，请检查网络连接。');
  }
}

async function requestCourseDetail(path: string): Promise<CourseDetail> {
  try {
    const response = await http.get<unknown>(path);
    const body = response.data as {
      code?: number;
      message?: string;
      data?: unknown;
      course?: Course;
      lessons?: CourseLesson[];
    };
    if (body.code !== undefined && body.code !== 200) {
      throw new CourseApiError(body.message || '课程详情加载失败，请稍后重试。');
    }
    let detail: PartialCourseDetail | undefined;
    if (body.data && typeof body.data === 'object') {
      const wrappedData = body.data as {data?: unknown};
      const payload = wrappedData.data && typeof wrappedData.data === 'object' ? wrappedData.data : body.data;
      detail = isCourse(payload)
        ? {course: payload, lessons: []}
        : payload as PartialCourseDetail;
    } else {
      detail = {course: body.course, lessons: body.lessons};
    }
    if (!detail.course) {
      throw new CourseApiError('课程详情数据不完整，请稍后重试。');
    }
    return {course: detail.course, lessons: Array.isArray(detail.lessons) ? detail.lessons : []};
  } catch (error) {
    if (error instanceof CourseApiError) {
      throw error;
    }
    const axiosError = error as AxiosError<ApiResponse<unknown>>;
    throw new CourseApiError(axiosError.response?.data?.message || '课程详情加载失败，请检查网络连接。');
  }
}

export function getRecommendCourses(): Promise<Course[]> {
  return requestCourses('/api/course/recommend');
}

export function getCourseList(): Promise<Course[]> {
  return requestCourses('/api/course/list');
}

export function getCourseDetail(courseId: number): Promise<CourseDetail> {
  return requestCourseDetail(`/api/course/${courseId}`);
}
