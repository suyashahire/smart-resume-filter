import { Resume, Interview, JobDescription } from '@/store/useStore';

// Simulate API delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Mock resume parsing
export async function parseResume(file: File): Promise<Partial<Resume>> {
  await delay(1500);
  
  // Generate mock data based on file name
  const mockSkills = [
    ['JavaScript', 'React', 'Node.js', 'TypeScript', 'MongoDB'],
    ['Python', 'Django', 'PostgreSQL', 'Machine Learning', 'TensorFlow'],
    ['Java', 'Spring Boot', 'MySQL', 'Microservices', 'Docker'],
    ['C++', 'Data Structures', 'Algorithms', 'System Design', 'Linux'],
    ['React', 'Next.js', 'TailwindCSS', 'GraphQL', 'AWS']
  ];
  
  const mockEducation = [
    'B.E. Computer Engineering - CGPA 8.5',
    'B.Tech Information Technology - CGPA 9.0',
    'B.Sc Computer Science - CGPA 8.2',
    'M.Tech Software Engineering - CGPA 8.8'
  ];
  
  const mockExperience = [
    '2 years at TCS as Software Developer',
    '3 years at Infosys as Senior Developer',
    '1 year at Wipro as Junior Developer',
    'Fresher with internship at startup',
    '4 years at Cognizant as Tech Lead'
  ];
  
  const randomIndex = Math.floor(Math.random() * 5);
  
  return {
    name: file.name.replace('.pdf', '').replace('.docx', '').replace(/_/g, ' '),
    email: `${file.name.split('.')[0]}@email.com`,
    phone: `+91 ${Math.floor(Math.random() * 9000000000) + 1000000000}`,
    skills: mockSkills[randomIndex],
    education: mockEducation[randomIndex % 4],
    experience: mockExperience[randomIndex],
    score: 0,
  };
}

// Mock job description parsing
export async function parseJobDescription(description: string): Promise<string[]> {
  await delay(1000);
  
  const commonKeywords = [
    'JavaScript', 'React', 'Node.js', 'TypeScript', 'Python', 
    'Java', 'Communication', 'Team Player', 'Problem Solving',
    'Machine Learning', 'Database', 'API', 'Agile'
  ];
  
  // Extract keywords from description
  const words = description.toLowerCase().split(/\W+/);
  const keywords = commonKeywords.filter(keyword => 
    words.some(word => word.includes(keyword.toLowerCase()))
  );
  
  return keywords.length > 0 ? keywords : ['JavaScript', 'React', 'Communication'];
}

// Mock candidate screening algorithm
export async function screenCandidates(
  resumes: Resume[], 
  jobDescription: JobDescription
): Promise<Resume[]> {
  await delay(2000);
  
  const scoredResumes = resumes.map(resume => {
    // Calculate score based on skill match
    const matchingSkills = resume.skills.filter(skill =>
      jobDescription.requiredSkills.some(reqSkill => 
        reqSkill.toLowerCase().includes(skill.toLowerCase()) ||
        skill.toLowerCase().includes(reqSkill.toLowerCase())
      )
    );
    
    const skillScore = (matchingSkills.length / jobDescription.requiredSkills.length) * 70;
    const experienceScore = Math.random() * 20; // Mock experience score
    const educationScore = Math.random() * 10; // Mock education score
    
    const totalScore = Math.min(100, skillScore + experienceScore + educationScore);
    
    return {
      ...resume,
      score: Math.round(totalScore)
    };
  });
  
  // Sort by score descending
  return scoredResumes.sort((a, b) => b.score - a.score);
}

// Mock interview transcription
export async function transcribeInterview(file: File): Promise<string> {
  await delay(2500);
  
  const mockTranscripts = [
    "I have strong experience in software development and team collaboration. I believe my skills in React and JavaScript make me a great fit for this role. I'm passionate about creating efficient solutions and learning new technologies.",
    "My background includes working on multiple full-stack projects. I excel at problem-solving and have led several successful projects. I'm confident in my ability to contribute to your team and grow with the company.",
    "I have experience working with various technologies and frameworks. I enjoy tackling challenging problems and working in agile environments. My communication skills help me work effectively with cross-functional teams.",
    "Throughout my career, I've focused on delivering high-quality code and mentoring junior developers. I'm excited about this opportunity and believe I can make a significant impact on your projects.",
    "I'm a quick learner with a strong foundation in computer science. I've successfully completed several projects during my internships and I'm eager to apply my skills in a professional setting."
  ];
  
  return mockTranscripts[Math.floor(Math.random() * mockTranscripts.length)];
}

// Mock sentiment analysis
export async function analyzeInterview(transcript: string): Promise<{
  sentimentScore: number;
  confidenceScore: number;
}> {
  await delay(1500);
  
  // Simple sentiment analysis based on keywords
  const positiveWords = ['strong', 'excellent', 'great', 'passionate', 'confident', 'successful', 'excited'];
  const words = transcript.toLowerCase().split(/\W+/);
  
  const positiveCount = words.filter(word => 
    positiveWords.some(pw => word.includes(pw))
  ).length;
  
  const sentimentScore = Math.min(100, 50 + (positiveCount * 10) + Math.random() * 20);
  const confidenceScore = Math.min(100, 60 + Math.random() * 35);
  
  return {
    sentimentScore: Math.round(sentimentScore),
    confidenceScore: Math.round(confidenceScore)
  };
}

// Mock generate report
export async function generateReport(candidateId: string, resume: Resume, interview?: Interview) {
  await delay(1000);
  
  const finalScore = interview 
    ? Math.round((resume.score * 0.6) + (interview.sentimentScore * 0.2) + (interview.confidenceScore * 0.2))
    : resume.score;
  
  return {
    candidateId,
    resume,
    interview,
    finalScore,
    recommendation: finalScore >= 75 ? 'Highly Recommended' : 
                    finalScore >= 60 ? 'Recommended' : 
                    finalScore >= 45 ? 'Maybe' : 'Not Recommended',
    generatedAt: new Date().toISOString()
  };
}

