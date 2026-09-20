import { notFound } from "next/navigation";
import { courses, getCourseById } from "../../../lib/courses";
import CourseDetailsClient from "../../../components/CourseDetailsClient";

export function generateStaticParams() {
  return courses.map((course) => ({ id: course.id }));
}

export default async function CourseDetailsPage({ params }) {
  const { id } = await params;
  const course = getCourseById(id);
  if (!course) notFound();
  return <CourseDetailsClient course={course} />;
}
