
// This is a script to help migrate mock data to Supabase
// You can run this in the browser console when logged in to seed your account with mock data

const mockNotes = [
  {
    title: "Project Extension",
    content: "Promised 2-week extension for final project to CS101 students who attended workshop.",
    type: "promise",
    course: "CS101",
    tags: ["extension", "project"],
    starred: true
  },
  {
    title: "Lab Equipment Order",
    content: "Need to order 5 more Raspberry Pi kits for the robotics lab by next Monday.",
    type: "note",
    course: "CS202",
    tags: ["supplies", "lab"]
  },
  {
    title: "Midterm Format Change",
    content: "Agreed to change midterm format to include more practical problems after student feedback.",
    type: "promise",
    course: "CS101",
    tags: ["exam", "format"]
  },
  {
    title: "Research Mentoring",
    content: "Promised to review Jane Smith's research proposal by this Friday.",
    type: "promise",
    course: "Research",
    tags: ["research", "mentoring"],
    student: "Jane Smith"
  },
  {
    title: "Lab Access",
    content: "Need to arrange extended lab access hours for senior project teams.",
    type: "note",
    course: "CS404",
    tags: ["lab", "access"]
  },
  {
    title: "Lecture Recording",
    content: "Promised to post recording of today's lecture due to technical issues during class.",
    type: "promise",
    course: "CS202",
    tags: ["lecture", "recording"],
    starred: true
  },
  {
    title: "Office Hours Extension",
    content: "Agreed to additional office hours before final project deadline.",
    type: "promise",
    course: "CS101",
    tags: ["office hours"]
  }
];

// You can copy and paste this in your browser console when logged in
async function seedMockData() {
  const { supabase } = window; // Assuming supabase client is accessible globally
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    console.error("You must be logged in to seed data");
    return;
  }
  
  console.log("Starting to seed mock data...");
  
  // Add user_id to each record
  const notesWithUserId = mockNotes.map(note => ({
    ...note,
    user_id: user.id,
    date: new Date().toISOString()
  }));
  
  // Insert the data
  const { data, error } = await supabase.from('notes').insert(notesWithUserId);
  
  if (error) {
    console.error("Error seeding data:", error);
  } else {
    console.log("Successfully seeded mock data!");
  }
}

// To use this, call seedMockData() in the browser console when logged in
