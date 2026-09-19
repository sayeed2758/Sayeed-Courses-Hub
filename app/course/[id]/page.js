import { notFound } from "next/navigation";
import { getCourseById } from "../../../lib/courses";
import CourseDetailsClient from "../../../components/CourseDetailsClient";

export function generateStaticParams() {
  return ["1", "2", "3", "4", "5", "6"].map((id) => ({ id }));
}

export default async function CourseDetailsPage({ params }) {
  const { id } = await params;
  const course = getCourseById(id);

  if (!course) notFound();

  return <CourseDetailsClient course={course} />;
}
