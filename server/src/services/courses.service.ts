import Course from '../models/Course.model';
import Enrollment from '../models/Enrollment.model';
import { ApiError } from '../utils/ApiError';
import mongoose from 'mongoose';
import {
  CourseType,
  CourseLevel,
  CourseFocus,
  Currency,
} from '../config/constants';

interface CreateCourseData {
  title: string;
  description: string;
  price: number;
  currency: Currency;
  type: CourseType;
  level: CourseLevel;
  focus: CourseFocus;
  totalSessions: number;
  sessionDuration: number;
  thumbnail?: string;
}

interface UpdateCourseData {
  title?: string;
  description?: string;
  price?: number;
  type?: CourseType;
  level?: CourseLevel;
  focus?: CourseFocus;
  totalSessions?: number;
  sessionDuration?: number;
  thumbnail?: string;
}

interface GetAllCoursesFilters {
  level?: string;
  type?: string;
  focus?: string;
  minPrice?: number;
  maxPrice?: number;
  page?: number;
  limit?: number;
}

export const coursesService = {
  /**
   * Create a new course (teacher only)
   */
  async createCourse(teacherId: string, courseData: CreateCourseData) {
    const course = await Course.create({
      ...courseData,
      teacher: teacherId,
      status: 'draft',
    });

    return {
      id: course._id,
      title: course.title,
      description: course.description,
      price: course.price,
      currency: course.currency,
      type: course.type,
      level: course.level,
      focus: course.focus,
      thumbnail: course.thumbnail,
      totalSessions: course.totalSessions,
      sessionDuration: course.sessionDuration,
      status: course.status,
      teacher: course.teacher,
      createdAt: course.createdAt,
      updatedAt: course.updatedAt,
    };
  },

  /**
   * Get all published courses with filtering and pagination
   */
  async getAllCourses(filters: GetAllCoursesFilters) {
    const {
      level,
      type,
      focus,
      minPrice,
      maxPrice,
      page = 1,
      limit = 20,
    } = filters;

    // Build filter query
    const query: any = { status: 'published' };

    if (level) query.level = level;
    if (type) query.type = type;
    if (focus) query.focus = focus;

    if (minPrice !== undefined || maxPrice !== undefined) {
      query.price = {};
      if (minPrice !== undefined) query.price.$gte = minPrice;
      if (maxPrice !== undefined) query.price.$lte = maxPrice;
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Execute query
    const [courses, total] = await Promise.all([
      Course.find(query)
        .populate('teacher', 'name email photo')
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 })
        .lean(),
      Course.countDocuments(query),
    ]);

    return {
      data: courses,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  /**
   * Get course by ID
   */
  async getCourseById(courseId: string) {
    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      throw new ApiError(400, 'Invalid course ID', 'INVALID_COURSE_ID');
    }

    const course = await Course.findById(courseId)
      .populate('teacher', 'name email photo bio specializations')
      .lean();

    if (!course) {
      throw new ApiError(404, 'Course not found', 'COURSE_NOT_FOUND');
    }

    // Only return published courses unless requested by the teacher
    if (course.status !== 'published') {
      throw new ApiError(404, 'Course not found', 'COURSE_NOT_FOUND');
    }

    return course;
  },

  /**
   * Get all courses by teacher (teacher only, own courses)
   */
  async getTeacherCourses(teacherId: string) {
    const courses = await Course.find({ teacher: teacherId })
      .sort({ createdAt: -1 })
      .lean();

    return courses;
  },

  /**
   * Update course (teacher only, own courses)
   */
  async updateCourse(
    courseId: string,
    teacherId: string,
    updates: UpdateCourseData
  ) {
    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      throw new ApiError(400, 'Invalid course ID', 'INVALID_COURSE_ID');
    }

    const course = await Course.findById(courseId);

    if (!course) {
      throw new ApiError(404, 'Course not found', 'COURSE_NOT_FOUND');
    }

    // Check ownership
    if (course.teacher.toString() !== teacherId) {
      throw new ApiError(
        403,
        'You are not authorized to update this course',
        'UNAUTHORIZED'
      );
    }

    // Business rule: Cannot change price of published course
    if (course.status === 'published' && updates.price !== undefined) {
      throw new ApiError(
        400,
        'Cannot change price of published course',
        'CANNOT_CHANGE_PRICE'
      );
    }

    // Update allowed fields
    if (updates.title !== undefined) course.title = updates.title;
    if (updates.description !== undefined)
      course.description = updates.description;
    if (updates.price !== undefined) course.price = updates.price;
    if (updates.type !== undefined) course.type = updates.type;
    if (updates.level !== undefined) course.level = updates.level;
    if (updates.focus !== undefined) course.focus = updates.focus;
    if (updates.totalSessions !== undefined)
      course.totalSessions = updates.totalSessions;
    if (updates.sessionDuration !== undefined)
      course.sessionDuration = updates.sessionDuration;
    if (updates.thumbnail !== undefined) course.thumbnail = updates.thumbnail;

    await course.save();

    return {
      id: course._id,
      title: course.title,
      description: course.description,
      price: course.price,
      currency: course.currency,
      type: course.type,
      level: course.level,
      focus: course.focus,
      thumbnail: course.thumbnail,
      totalSessions: course.totalSessions,
      sessionDuration: course.sessionDuration,
      status: course.status,
      teacher: course.teacher,
      createdAt: course.createdAt,
      updatedAt: course.updatedAt,
    };
  },

  /**
   * Delete course (teacher only, own courses)
   */
  async deleteCourse(courseId: string, teacherId: string) {
    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      throw new ApiError(400, 'Invalid course ID', 'INVALID_COURSE_ID');
    }

    const course = await Course.findById(courseId);

    if (!course) {
      throw new ApiError(404, 'Course not found', 'COURSE_NOT_FOUND');
    }

    // Check ownership
    if (course.teacher.toString() !== teacherId) {
      throw new ApiError(
        403,
        'You are not authorized to delete this course',
        'UNAUTHORIZED'
      );
    }

    // Business rule: Cannot delete course with enrollments
    const enrollmentCount = await Enrollment.countDocuments({
      course: courseId,
      isActive: true,
    });

    if (enrollmentCount > 0) {
      throw new ApiError(
        400,
        'Cannot delete course with active enrollments',
        'HAS_ENROLLMENTS'
      );
    }

    await Course.findByIdAndDelete(courseId);

    return { message: 'Course deleted successfully' };
  },

  /**
   * Publish course (teacher only, own courses)
   */
  async publishCourse(courseId: string, teacherId: string) {
    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      throw new ApiError(400, 'Invalid course ID', 'INVALID_COURSE_ID');
    }

    const course = await Course.findById(courseId);

    if (!course) {
      throw new ApiError(404, 'Course not found', 'COURSE_NOT_FOUND');
    }

    // Check ownership
    if (course.teacher.toString() !== teacherId) {
      throw new ApiError(
        403,
        'You are not authorized to publish this course',
        'UNAUTHORIZED'
      );
    }

    if (course.status === 'published') {
      throw new ApiError(
        400,
        'Course is already published',
        'ALREADY_PUBLISHED'
      );
    }

    course.status = 'published';
    await course.save();

    return {
      id: course._id,
      title: course.title,
      status: course.status,
      updatedAt: course.updatedAt,
    };
  },

  /**
   * Archive course (teacher only, own courses)
   */
  async archiveCourse(courseId: string, teacherId: string) {
    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      throw new ApiError(400, 'Invalid course ID', 'INVALID_COURSE_ID');
    }

    const course = await Course.findById(courseId);

    if (!course) {
      throw new ApiError(404, 'Course not found', 'COURSE_NOT_FOUND');
    }

    // Check ownership
    if (course.teacher.toString() !== teacherId) {
      throw new ApiError(
        403,
        'You are not authorized to archive this course',
        'UNAUTHORIZED'
      );
    }

    if (course.status === 'archived') {
      throw new ApiError(
        400,
        'Course is already archived',
        'ALREADY_ARCHIVED'
      );
    }

    course.status = 'archived';
    await course.save();

    return {
      id: course._id,
      title: course.title,
      status: course.status,
      updatedAt: course.updatedAt,
    };
  },
};
