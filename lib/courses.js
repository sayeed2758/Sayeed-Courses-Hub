export const categories = ["All", "KVS", "NVS", "CTET", "Teaching", "SSC"];

export const TELEGRAM_ACCESS_NOTE = "Add each private Telegram course link in this file before publishing the final catalogue.";

export const courses = [
  {
    id: "1",
    number: 1,
    category: "KVS",
    title: "KVS / NVS INTERVIEW BATCH",
    artTitle: "INTERVIEW",
    badge: "FREE",
    meta: "Interview Preparation",
    description: "Premium interview preparation resources, practice and guidance in one focused learning path.",
    tone: "blue",
    status: "active",
    featured: true,
    telegramUrl: "",
    instructor: "Sayeed Courses Hub",
    duration: "Self-paced",
    lessons: "24+ Lessons",
    resources: "PDFs + Practice",
    language: "Hindi + English",
    overview: "A structured interview-preparation course designed to keep your learning organized and focused.",
    learn: ["Interview fundamentals", "Question practice", "Answer framing", "Revision resources"],
    modules: ["Interview Foundation", "Practice Questions", "Mock Preparation", "Final Revision"]
  },
  {
    id: "2",
    number: 2,
    category: "CTET",
    title: "CTET COMPLETE PREPARATION",
    artTitle: "CTET",
    badge: "NEW",
    meta: "Paper I + II",
    description: "Structured preparation resources with chapter-wise study support and quick revision.",
    tone: "purple",
    status: "active",
    featured: true,
    telegramUrl: "",
    instructor: "Sayeed Courses Hub",
    duration: "Self-paced",
    lessons: "30+ Lessons",
    resources: "Notes + Practice",
    language: "Hindi + English",
    overview: "A clean course structure for learners who want chapter-wise preparation and quick revision.",
    learn: ["Core concepts", "Chapter-wise practice", "Revision strategy", "Mock practice"],
    modules: ["Course Orientation", "Concept Builder", "Practice Zone", "Revision & Mock"]
  },
  {
    id: "3",
    number: 3,
    category: "Teaching",
    title: "TEACHER'S TOOLKIT",
    artTitle: "TEACH",
    badge: "FREE",
    meta: "Teaching Resources",
    description: "Useful classroom resources, worksheets and smart teaching material for everyday lessons.",
    tone: "teal",
    status: "active",
    featured: false,
    telegramUrl: "",
    instructor: "Sayeed Courses Hub",
    duration: "Self-paced",
    lessons: "20+ Resources",
    resources: "Worksheets + Tools",
    language: "English + Hindi",
    overview: "A practical collection of classroom-ready teaching resources and smart teaching ideas.",
    learn: ["Worksheet planning", "Classroom ideas", "Teaching resources", "Activity support"],
    modules: ["Teaching Basics", "Worksheet Bank", "Classroom Activities", "Resource Library"]
  },
  {
    id: "4",
    number: 4,
    category: "SSC",
    title: "SSC FOUNDATION BATCH",
    artTitle: "SSC",
    badge: "POPULAR",
    meta: "Foundation Course",
    description: "A focused foundation track for systematic exam preparation with a clean study flow.",
    tone: "orange",
    status: "active",
    featured: true,
    telegramUrl: "",
    instructor: "Sayeed Courses Hub",
    duration: "Self-paced",
    lessons: "28+ Lessons",
    resources: "Notes + Mock Sets",
    language: "Hindi + English",
    overview: "A foundation route that organizes essential concepts into a simple and progressive learning path.",
    learn: ["Foundation concepts", "Practice sets", "Revision", "Mock preparation"],
    modules: ["Foundation", "Concept Practice", "Advanced Practice", "Mock & Revision"]
  },
  {
    id: "5",
    number: 5,
    category: "NVS",
    title: "NVS INTERVIEW CRASH COURSE",
    artTitle: "NVS",
    badge: "NEW",
    meta: "Interview Preparation",
    description: "Focused interview-oriented practice for quick revision and confidence building.",
    tone: "blue",
    status: "active",
    featured: false,
    telegramUrl: "",
    instructor: "Sayeed Courses Hub",
    duration: "Self-paced",
    lessons: "16+ Lessons",
    resources: "Practice + PDFs",
    language: "Hindi + English",
    overview: "A compact preparation route for focused interview practice and revision.",
    learn: ["Important questions", "Practice answers", "Confidence building", "Quick revision"],
    modules: ["Important Topics", "Practice Round", "Mock Interview", "Quick Revision"]
  },
  {
    id: "6",
    number: 6,
    category: "KVS",
    title: "KVS PRACTICE & MOCK SET",
    artTitle: "MOCK",
    badge: "SOON",
    meta: "Practice",
    description: "Mock-based preparation resources for repeated practice and revision.",
    tone: "purple",
    status: "inactive",
    featured: false,
    telegramUrl: "",
    instructor: "Sayeed Courses Hub",
    duration: "Coming Soon",
    lessons: "Coming Soon",
    resources: "Coming Soon",
    language: "Hindi + English",
    overview: "This course is prepared for a future practice and mock-test release.",
    learn: ["Practice sets", "Mock tests", "Revision", "Performance review"],
    modules: ["Practice", "Mock Tests", "Revision", "Performance"]
  }
];

export function getCourseById(id) {
  return courses.find((course) => course.id === String(id));
}

export function getCategoryCounts(items) {
  return items.reduce((counts, course) => {
    counts.All = (counts.All || 0) + 1;
    counts[course.category] = (counts[course.category] || 0) + 1;
    return counts;
  }, { All: 0 });
}
