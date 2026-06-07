export const CLASS_SUBJECTS_DATA: Record<string, string[]> = {
  "Class I to V": ["All Subjects (General)", "English", "Hindi", "Maths", "EVS", "Jolly Phonics", "Abacus", "Vedic Maths", "Computer", "Cursive Writing", "Storytelling", "Art & Craft"],
  "Class VI to VIII": ["Maths", "Science", "Social Science (SST)", "English", "Hindi", "Sanskrit", "French", "German", "Spanish", "Computer/ICT", "Robotics"],
  "Class IX to X": ["Maths (Standard/Basic)", "Physics", "Chemistry", "Biology", "History", "Civics", "Geography", "Economics", "English (Language & Literature)", "Hindi (A/B)", "Sanskrit", "French", "German", "Information Technology (IT)", "Artificial Intelligence (AI)", "Robotics"],
  "Class XI to XII": ["Physics", "Chemistry", "Maths", "Biology", "Biotechnology", "IP", "Accounts", "Business Studies", "Economics", "Applied Maths", "Entrepreneurship", "Psychology", "Sociology", "Political Science", "History", "Geography", "Home Science", "Legal Studies", "English Core", "English Elective", "Physical Education", "Fine Arts"]
};

export const SPECIALIZED_SUB_CATEGORIES: Record<string, string[]> = {
  "Entrance Exam & Specialization": ["JEE", "NEET", "IELTS / TOEFL", "Foreign Languages", "Regional & Indian Languages"]
};

export const SPECIALIZED_SUBJECTS: Record<string, any> = {
  "JEE": [
    "Physics (IIT-JEE Mains & Advanced)",
    "Organic Chemistry",
    "Inorganic Chemistry",
    "Physical Chemistry",
    "Mathematics (IIT-JEE Mains & Advanced)"
  ],
  "NEET": [
    "Physics (NEET Level)",
    "Organic Chemistry",
    "Inorganic Chemistry",
    "Physical Chemistry",
    "Botany",
    "Zoology"
  ],
  "IELTS / TOEFL": [
    "Speaking & Listening",
    "Reading & Writing",
    "General Training Prep",
    "Academic Test Prep"
  ],
  "Foreign Languages": {
    "Most Popular & Academic": [
      "English (Spoken, Business & Corporate)",
      "French (School Curriculum & DELF Prep)",
      "German (Goethe Institute Exam Prep)",
      "Spanish (DELE Exam Prep)"
    ],
    "Asian Languages - High Demand": [
      "Japanese (JLPT N5 to N1 Prep)",
      "Mandarin / Chinese (HSK Prep)",
      "Korean (TOPIK Exam Prep)",
      "Arabic (Modern Standard & Conversational)"
    ],
    "European Languages": [
      "Italian",
      "Russian",
      "Portuguese"
    ]
  },
  "Regional & Indian Languages": {
    "National & Classical": [
      "Hindi (Academic & Spoken)",
      "Sanskrit",
      "Urdu"
    ],
    "North & West India": [
      "Punjabi",
      "Gujarati",
      "Marathi",
      "Marwari / Rajasthani",
      "Kashmiri",
      "Konkani",
      "Sindhi"
    ],
    "South India": [
      "Tamil",
      "Telugu",
      "Kannada",
      "Malayalam"
    ],
    "East & Northeast India": [
      "Bengali",
      "Odia",
      "Assamese",
      "Maithili",
      "Nepali",
      "Manipuri"
    ]
  }
};
