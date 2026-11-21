import Resume from "../models/Resume.js";
import ai from "../configs/ai.js";

// controller for enhancing a resume's professional summary
// POST: /api/ai/enhance-pro-sum
export const enhanceProfessionalSummary = async (req, res) => {
    try {
        const { userContent } = req.body;

        if(!userContent){
            return res.status(400).json({message: 'Missing required fields'})
        }

       const response = await ai.chat.completions.create({
            model: process.env.OPENAI_MODEL,
            messages: [
                { role: "system", content: "You are an expert in resume writing. Your task is to enhance the professional summary of a resume. The summary should be 1-2 sentences also highlighting key skills, experience, and career objectives. Make it compelling and ATS-friendly. and only return text no options or anything else." },
                {
                    role: "user",
                    content: userContent,
                },
    ],
        })

        const enhancedContent = response.choices[0].message.content;
        return res.status(200).json({enhancedContent})
    } catch (error) {
        return res.status(400).json({message: error.message})
    }
}

// controller for enhancing a resume's job description
// POST: /api/ai/enhance-job-desc
export const enhanceJobDescription = async (req, res) => {
    try {
        const { userContent } = req.body;

        if(!userContent){
            return res.status(400).json({message: 'Missing required fields'})
        }

       const response = await ai.chat.completions.create({
            model: process.env.OPENAI_MODEL,
            messages: [
                { role: "system",
                 content: "You are an expert in resume writing. Your task is to enhance the job description of a resume. The job description should be only in 1-2 sentence also highlighting key responsibilities and achievements. Use action verbs and quantifiable results where possible. Make it ATS-friendly. and only return text no options or anything else." },
                {
                    role: "user",
                    content: userContent,
                },
    ],
        })

        const enhancedContent = response.choices[0].message.content;
        return res.status(200).json({enhancedContent})
    } catch (error) {
        return res.status(400).json({message: error.message})
    }
}

// controller for uploading a resume to the database
// POST: /api/ai/upload-resume
export const analyzeATS = async (req, res) => {
    try {
        const { resumeData, jobDescription } = req.body;

        if (!resumeData || !jobDescription) {
            return res.status(400).json({ message: 'Missing required fields' })
        }

        const resumeText = JSON.stringify(resumeData, null, 2)

        const systemPrompt = `You are an expert ATS (Applicant Tracking System) analyzer with 10+ years of experience in recruitment and HR. Be strict and realistic. Do not inflate the score. Return ONLY a valid JSON object with NO extra text, NO markdown, NO backticks, exactly in this format.`

        const userPrompt = `
RESUME:
${resumeText}

JOB DESCRIPTION:
${jobDescription}

Analyze and return ONLY a valid JSON object with NO extra text, NO markdown, NO backticks, exactly in this format:

{
  "ats_score": <number between 0-100>,
  
  "score_breakdown": {
    "keyword_match": <number out of 40>,
    "skills_match": <number out of 30>,
    "experience_match": <number out of 20>,
    "format_quality": <number out of 10>
  },
  
  "matched_keywords": ["keyword1", "keyword2"],
  
  "missing_keywords": ["keyword1", "keyword2"],
  
  "changes_needed": [
    {
      "section": "Skills",
      "issue": "Docker is missing",
      "fix": "Add Docker to your skills section",
      "priority": "High"
    }
  ],
  
  "strengths": ["strength1", "strength2"],
  
  "overall_feedback": "2-3 line summary of the resume match"
}

Scoring Rules:
- keyword_match: How many JD keywords appear in resume (out of 40)
- skills_match: How well technical + soft skills align (out of 30)
- experience_match: How relevant projects/experience are (out of 20)
- format_quality: Resume structure, action verbs, measurable impact (out of 10)
- ats_score: Total of all 4 scores above
`

        const response = await ai.chat.completions.create({
            model: process.env.OPENAI_MODEL,
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt },
            ],
            response_format: { type: 'json_object' },
        })

        const analysisText = response.choices[0].message.content
        const analysis = JSON.parse(analysisText)

        return res.status(200).json({ analysis })
    } catch (error) {
        return res.status(400).json({ message: error.message })
    }
}

export const uploadResume = async (req, res) => {
    try {
       
        const {resumeText, title} = req.body;
        const userId = req.userId;

        if(!resumeText){
            return res.status(400).json({message: 'Missing required fields'})
        }

        const systemPrompt = "You are an expert AI Agent to extract data from resume."

        const userPrompt = `extract data from this resume: ${resumeText}
        
        Provide data in the following JSON format with no additional text before or after:

        {
        professional_summary: { type: String, default: '' },
        skills: [{ type: String }],
        personal_info: {
            image: {type: String, default: '' },
            full_name: {type: String, default: '' },
            profession: {type: String, default: '' },
            email: {type: String, default: '' },
            phone: {type: String, default: '' },
            location: {type: String, default: '' },
            linkedin: {type: String, default: '' },
            website: {type: String, default: '' },
        },
        experience: [
            {
                company: { type: String },
                position: { type: String },
                start_date: { type: String },
                end_date: { type: String },
                description: { type: String },
                is_current: { type: Boolean },
            }
        ],
        project: [
            {
                name: { type: String },
                type: { type: String },
                description: { type: String },
            }
        ],
        education: [
            {
                institution: { type: String },
                degree: { type: String },
                field: { type: String },
                graduation_date: { type: String },
                gpa: { type: String },
            }
        ],          
        }
        `;

       const response = await ai.chat.completions.create({
            model: process.env.OPENAI_MODEL,
            messages: [
                { role: "system",
                 content: systemPrompt },
                {
                    role: "user",
                    content: userPrompt,
                },
        ],
        response_format: {type:  'json_object'}
        })

        const extractedData = response.choices[0].message.content;
        const parsedData = JSON.parse(extractedData)
        const newResume = await Resume.create({userId, title, ...parsedData})

        res.json({resumeId: newResume._id})
    } catch (error) {
        return res.status(400).json({message: error.message})
    }
}