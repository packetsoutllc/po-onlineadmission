import React, { useState } from 'react';
import { ResumeData, ExperienceItem, EducationItem, ProjectItem, LanguageItem, CertificationItem } from '../types';
import { Plus, Trash2, ChevronDown, ChevronUp, Wand2, Briefcase, GraduationCap, User, Code, FolderGit2, Languages, Award, Heart } from 'lucide-react';
import { enhanceText, generateSummary } from '../services/geminiService';

interface ResumeEditorProps {
  data: ResumeData;
  onChange: (data: ResumeData) => void;
}

const SectionHeader: React.FC<{ title: string; icon: React.ReactNode; isOpen: boolean; toggle: () => void }> = ({ title, icon, isOpen, toggle }) => (
  <button 
    onClick={toggle}
    className="w-full flex items-center justify-between p-4 bg-white border border-slate-200 rounded-lg mb-2 hover:bg-slate-50 transition-colors shadow-sm"
  >
    <div className="flex items-center gap-3 text-slate-700 font-semibold">
      <div className="text-indigo-600">{icon}</div>
      <span>{title}</span>
    </div>
    {isOpen ? <ChevronUp size={18} className="text-slate-400" /> : <ChevronDown size={18} className="text-slate-400" />}
  </button>
);

export const ResumeEditor: React.FC<ResumeEditorProps> = ({ data, onChange }) => {
  const [openSection, setOpenSection] = useState<string | null>('personal');
  const [isAiLoading, setIsAiLoading] = useState(false);

  const updatePersonal = (field: keyof ResumeData['personal'], value: string) => {
    onChange({ ...data, personal: { ...data.personal, [field]: value } });
  };

  const toggleSection = (section: string) => setOpenSection(openSection === section ? null : section);

  const handleAiEnhance = async (field: 'summary', text: string) => {
    if (!text) return;
    setIsAiLoading(true);
    const enhanced = await enhanceText(text, field);
    updatePersonal(field, enhanced);
    setIsAiLoading(false);
  };

  const handleGenerateSummary = async () => {
    if (!data.personal.jobTitle) return;
    setIsAiLoading(true);
    const summary = await generateSummary(data.personal.jobTitle, data.skills);
    updatePersonal('summary', summary);
    setIsAiLoading(false);
  };

  // --- Experience Helpers ---
  const addExperience = () => {
    const newExp: ExperienceItem = {
      id: `exp_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      company: '', position: '', startDate: '', endDate: '', current: false, description: '', location: ''
    };
    onChange({ ...data, experience: [...data.experience, newExp] });
  };
  
  const updateExperience = (id: string, field: keyof ExperienceItem, value: any) => {
    const newExp = data.experience.map(exp => exp.id === id ? { ...exp, [field]: value } : exp);
    onChange({ ...data, experience: newExp });
  };

  const removeExperience = (id: string) => {
    onChange({ ...data, experience: data.experience.filter(e => e.id !== id) });
  };

  // --- Education Helpers ---
  const addEducation = () => {
    const newEdu: EducationItem = {
      id: `edu_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      institution: '', degree: '', fieldOfStudy: '', startDate: '', endDate: '', score: ''
    };
    onChange({ ...data, education: [...data.education, newEdu] });
  };

  const updateEducation = (id: string, field: keyof EducationItem, value: any) => {
    onChange({ ...data, education: data.education.map(e => e.id === id ? { ...e, [field]: value } : e) });
  };

  const removeEducation = (id: string) => {
    onChange({ ...data, education: data.education.filter(e => e.id !== id) });
  };

  // --- Project Helpers ---
  const addProject = () => {
    const newProj: ProjectItem = { id: `proj_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`, name: '', description: '', link: '', technologies: '' };
    onChange({ ...data, projects: [...data.projects, newProj] });
  };

  const updateProject = (id: string, field: keyof ProjectItem, value: string) => {
    onChange({ ...data, projects: data.projects.map(p => p.id === id ? { ...p, [field]: value } : p) });
  };

  const removeProject = (id: string) => {
    onChange({ ...data, projects: data.projects.filter(p => p.id !== id) });
  };

  // --- Language Helpers ---
  const addLanguage = () => {
    onChange({ ...data, languages: [...data.languages, { id: `lang_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`, language: '', proficiency: '' }]});
  };

  const updateLanguage = (id: string, field: keyof LanguageItem, value: string) => {
    onChange({ ...data, languages: data.languages.map(l => l.id === id ? { ...l, [field]: value } : l) });
  };

  const removeLanguage = (id: string) => {
    onChange({ ...data, languages: data.languages.filter(l => l.id !== id) });
  };

  // --- Certification Helpers ---
  const addCertification = () => {
    onChange({ ...data, certifications: [...data.certifications, { id: `cert_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`, name: '', issuer: '', date: '' }]});
  };

  const updateCertification = (id: string, field: keyof CertificationItem, value: string) => {
    onChange({ ...data, certifications: data.certifications.map(c => c.id === id ? { ...c, [field]: value } : c) });
  };

  const removeCertification = (id: string) => {
    onChange({ ...data, certifications: data.certifications.filter(c => c.id !== id) });
  };

  const updateSkills = (val: string) => {
    const skills = val.split(',').map(s => s.trim()).filter(s => s !== '');
    onChange({ ...data, skills });
  };

  const updateInterests = (val: string) => {
    const interests = val.split(',').map(s => s.trim()).filter(s => s !== '');
    onChange({ ...data, interests });
  };

  return (
    <div className="space-y-4 pb-20">
      {/* Personal Details */}
      <div>
        <SectionHeader title="Personal Details" icon={<User size={20}/>} isOpen={openSection === 'personal'} toggle={() => toggleSection('personal')} />
        {openSection === 'personal' && (
          <div className="bg-white p-5 rounded-lg shadow-sm border border-slate-200 space-y-4 animate-fadeIn">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input type="text" placeholder="Full Name" className="input-field" value={data.personal.fullName} onChange={e => updatePersonal('fullName', e.target.value)} />
              <input type="text" placeholder="Job Title" className="input-field" value={data.personal.jobTitle} onChange={e => updatePersonal('jobTitle', e.target.value)} />
              <input type="email" placeholder="Email" className="input-field" value={data.personal.email} onChange={e => updatePersonal('email', e.target.value)} />
              <input type="text" placeholder="Phone" className="input-field" value={data.personal.phone} onChange={e => updatePersonal('phone', e.target.value)} />
              <input type="text" placeholder="Location (City, Country)" className="input-field" value={data.personal.location} onChange={e => updatePersonal('location', e.target.value)} />
              <input type="text" placeholder="LinkedIn / Portfolio URL" className="input-field" value={data.personal.website} onChange={e => updatePersonal('website', e.target.value)} />
            </div>
            <div className="relative">
              <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Professional Summary</label>
              <textarea 
                rows={4} 
                placeholder="Brief professional summary..." 
                className="input-field resize-none"
                value={data.personal.summary}
                onChange={e => updatePersonal('summary', e.target.value)}
              />
              <div className="absolute top-7 right-2 flex gap-2">
                <button 
                  onClick={handleGenerateSummary}
                  className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded hover:bg-indigo-200 flex items-center gap-1 transition"
                  title="Generate with AI"
                  disabled={isAiLoading}
                >
                  <Wand2 size={12} /> Generate
                </button>
                <button 
                  onClick={() => handleAiEnhance('summary', data.personal.summary)}
                  className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded hover:bg-emerald-200 flex items-center gap-1 transition"
                  title="Enhance with AI"
                  disabled={isAiLoading}
                >
                  <Wand2 size={12} /> Enhance
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Experience */}
      <div>
        <SectionHeader title="Work Experience" icon={<Briefcase size={20}/>} isOpen={openSection === 'experience'} toggle={() => toggleSection('experience')} />
        {openSection === 'experience' && (
          <div className="bg-white p-5 rounded-lg shadow-sm border border-slate-200 space-y-6 animate-fadeIn">
            {data.experience.map((exp) => (
              <div key={exp.id} className="border-b border-slate-100 pb-6 last:border-0 last:pb-0 relative group">
                <button onClick={() => removeExperience(exp.id)} className="absolute top-0 right-0 text-red-400 hover:text-red-600 p-1 opacity-0 group-hover:opacity-100 transition"><Trash2 size={16}/></button>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                  <input type="text" placeholder="Company Name" className="input-field" value={exp.company} onChange={e => updateExperience(exp.id, 'company', e.target.value)} />
                  <input type="text" placeholder="Position Title" className="input-field" value={exp.position} onChange={e => updateExperience(exp.id, 'position', e.target.value)} />
                  <div className="flex gap-2">
                    <input type="text" placeholder="Start Date" className="input-field" value={exp.startDate} onChange={e => updateExperience(exp.id, 'startDate', e.target.value)} />
                    <input type="text" placeholder="End Date" className="input-field" disabled={exp.current} value={exp.current ? 'Present' : exp.endDate} onChange={e => updateExperience(exp.id, 'endDate', e.target.value)} />
                  </div>
                   <div className="flex items-center">
                      <input type="checkbox" id={`curr-${exp.id}`} checked={exp.current} onChange={e => updateExperience(exp.id, 'current', e.target.checked)} className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500" />
                      <label htmlFor={`curr-${exp.id}`} className="ml-2 text-sm text-gray-600">I currently work here</label>
                   </div>
                   <input type="text" placeholder="Location" className="input-field md:col-span-2" value={exp.location} onChange={e => updateExperience(exp.id, 'location', e.target.value)} />
                </div>
                <textarea 
                    rows={3} 
                    placeholder="Responsibilities and achievements..." 
                    className="input-field resize-none mb-2"
                    value={exp.description}
                    onChange={e => updateExperience(exp.id, 'description', e.target.value)}
                  />
                  <button 
                    onClick={async () => {
                        setIsAiLoading(true);
                        const res = await enhanceText(exp.description, 'experience');
                        updateExperience(exp.id, 'description', res);
                        setIsAiLoading(false);
                    }}
                    className="text-xs flex items-center gap-1 text-indigo-600 font-medium hover:text-indigo-800"
                    disabled={isAiLoading}
                  >
                    <Wand2 size={12}/> Optimize Description with AI
                  </button>
              </div>
            ))}
            <button onClick={addExperience} className="w-full py-2 border-2 border-dashed border-slate-300 text-slate-500 rounded-lg hover:border-blue-400 hover:text-blue-500 transition flex items-center justify-center gap-2">
              <Plus size={18} /> Add Experience
            </button>
          </div>
        )}
      </div>

      {/* Education */}
      <div>
        <SectionHeader title="Education" icon={<GraduationCap size={20}/>} isOpen={openSection === 'education'} toggle={() => toggleSection('education')} />
        {openSection === 'education' && (
          <div className="bg-white p-5 rounded-lg shadow-sm border border-slate-200 space-y-6 animate-fadeIn">
            {data.education.map((edu) => (
              <div key={edu.id} className="border-b border-slate-100 pb-6 last:border-0 last:pb-0 relative group">
                <button onClick={() => removeEducation(edu.id)} className="absolute top-0 right-0 text-red-400 hover:text-red-600 p-1 opacity-0 group-hover:opacity-100 transition"><Trash2 size={16}/></button>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input type="text" placeholder="School / University" className="input-field" value={edu.institution} onChange={e => updateEducation(edu.id, 'institution', e.target.value)} />
                  <input type="text" placeholder="Degree / Certification" className="input-field" value={edu.degree} onChange={e => updateEducation(edu.id, 'degree', e.target.value)} />
                  <input type="text" placeholder="Start Date" className="input-field" value={edu.startDate} onChange={e => updateEducation(edu.id, 'startDate', e.target.value)} />
                  <input type="text" placeholder="End Date" className="input-field" value={edu.endDate} onChange={e => updateEducation(edu.id, 'endDate', e.target.value)} />
                  <input type="text" placeholder="GPA / Score (Optional)" className="input-field md:col-span-2" value={edu.score} onChange={e => updateEducation(edu.id, 'score', e.target.value)} />
                </div>
              </div>
            ))}
             <button onClick={addEducation} className="w-full py-2 border-2 border-dashed border-slate-300 text-slate-500 rounded-lg hover:border-blue-400 hover:text-blue-500 transition flex items-center justify-center gap-2">
              <Plus size={18} /> Add Education
            </button>
          </div>
        )}
      </div>

       {/* Skills */}
       <div>
        <SectionHeader title="Skills" icon={<Code size={20}/>} isOpen={openSection === 'skills'} toggle={() => toggleSection('skills')} />
        {openSection === 'skills' && (
          <div className="bg-white p-5 rounded-lg shadow-sm border border-slate-200 animate-fadeIn">
             <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Skills (Comma separated)</label>
             <textarea 
              rows={3}
              className="input-field" 
              placeholder="React, TypeScript, Node.js, Project Management..."
              value={data.skills.join(', ')}
              onChange={e => updateSkills(e.target.value)}
             />
          </div>
        )}
      </div>

      {/* Projects */}
      <div>
        <SectionHeader title="Projects" icon={<FolderGit2 size={20}/>} isOpen={openSection === 'projects'} toggle={() => toggleSection('projects')} />
        {openSection === 'projects' && (
          <div className="bg-white p-5 rounded-lg shadow-sm border border-slate-200 space-y-6 animate-fadeIn">
            {data.projects.map((proj) => (
              <div key={proj.id} className="border-b border-slate-100 pb-6 last:border-0 last:pb-0 relative group">
                 <button onClick={() => removeProject(proj.id)} className="absolute top-0 right-0 text-red-400 hover:text-red-600 p-1 opacity-0 group-hover:opacity-100 transition"><Trash2 size={16}/></button>
                 <div className="grid grid-cols-1 gap-4 mb-3">
                    <input type="text" placeholder="Project Name" className="input-field font-semibold" value={proj.name} onChange={e => updateProject(proj.id, 'name', e.target.value)} />
                    <input type="text" placeholder="Project Link (Optional)" className="input-field text-sm" value={proj.link} onChange={e => updateProject(proj.id, 'link', e.target.value)} />
                    <input type="text" placeholder="Technologies Used" className="input-field text-sm" value={proj.technologies} onChange={e => updateProject(proj.id, 'technologies', e.target.value)} />
                    <textarea placeholder="Brief description of the project..." rows={2} className="input-field" value={proj.description} onChange={e => updateProject(proj.id, 'description', e.target.value)} />
                 </div>
              </div>
            ))}
            <button onClick={addProject} className="w-full py-2 border-2 border-dashed border-slate-300 text-slate-500 rounded-lg hover:border-blue-400 hover:text-blue-500 transition flex items-center justify-center gap-2">
              <Plus size={18} /> Add Project
            </button>
          </div>
        )}
      </div>

      {/* Languages */}
      <div>
        <SectionHeader title="Languages" icon={<Languages size={20}/>} isOpen={openSection === 'languages'} toggle={() => toggleSection('languages')} />
        {openSection === 'languages' && (
          <div className="bg-white p-5 rounded-lg shadow-sm border border-slate-200 space-y-4 animate-fadeIn">
            {data.languages.map((lang) => (
              <div key={lang.id} className="flex gap-3 items-center relative group">
                <input type="text" placeholder="Language" className="input-field flex-1" value={lang.language} onChange={e => updateLanguage(lang.id, 'language', e.target.value)} />
                <input type="text" placeholder="Proficiency (e.g., Native, B2)" className="input-field flex-1" value={lang.proficiency} onChange={e => updateLanguage(lang.id, 'proficiency', e.target.value)} />
                <button onClick={() => removeLanguage(lang.id)} className="text-red-400 hover:text-red-600 p-1"><Trash2 size={16}/></button>
              </div>
            ))}
            <button onClick={addLanguage} className="text-sm text-indigo-600 font-medium hover:text-indigo-800 flex items-center gap-1 mt-2">
              <Plus size={14} /> Add Language
            </button>
          </div>
        )}
      </div>

      {/* Certifications */}
      <div>
        <SectionHeader title="Certifications" icon={<Award size={20}/>} isOpen={openSection === 'certifications'} toggle={() => toggleSection('certifications')} />
        {openSection === 'certifications' && (
          <div className="bg-white p-5 rounded-lg shadow-sm border border-slate-200 space-y-6 animate-fadeIn">
            {data.certifications.map((cert) => (
              <div key={cert.id} className="border-b border-slate-100 pb-4 last:border-0 last:pb-0 relative group">
                 <button onClick={() => removeCertification(cert.id)} className="absolute top-0 right-0 text-red-400 hover:text-red-600 p-1 opacity-0 group-hover:opacity-100 transition"><Trash2 size={16}/></button>
                 <div className="grid grid-cols-1 gap-3">
                    <input type="text" placeholder="Certification Name" className="input-field font-semibold" value={cert.name} onChange={e => updateCertification(cert.id, 'name', e.target.value)} />
                    <div className="flex gap-3">
                       <input type="text" placeholder="Issuer" className="input-field flex-1" value={cert.issuer} onChange={e => updateCertification(cert.id, 'issuer', e.target.value)} />
                       <input type="text" placeholder="Date" className="input-field w-1/3" value={cert.date} onChange={e => updateCertification(cert.id, 'date', e.target.value)} />
                    </div>
                 </div>
              </div>
            ))}
            <button onClick={addCertification} className="w-full py-2 border-2 border-dashed border-slate-300 text-slate-500 rounded-lg hover:border-blue-400 hover:text-blue-500 transition flex items-center justify-center gap-2">
              <Plus size={18} /> Add Certification
            </button>
          </div>
        )}
      </div>

      {/* Interests */}
      <div>
        <SectionHeader title="Interests" icon={<Heart size={20}/>} isOpen={openSection === 'interests'} toggle={() => toggleSection('interests')} />
        {openSection === 'interests' && (
          <div className="bg-white p-5 rounded-lg shadow-sm border border-slate-200 animate-fadeIn">
             <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Interests (Comma separated)</label>
             <textarea 
              rows={2}
              className="input-field" 
              placeholder="Photography, Hiking, Open Source, Traveling..."
              value={data.interests.join(', ')}
              onChange={e => updateInterests(e.target.value)}
             />
          </div>
        )}
      </div>

    </div>
  );
};

// Styles are mostly utility classes, but keeping the style tag injection for input field specific overrides
const inputStyles = `
  .input-field {
    width: 100%;
    padding: 0.6rem 0.85rem;
    background-color: #f8fafc;
    border: 1px solid #cbd5e1;
    border-radius: 0.5rem;
    color: #334155;
    font-size: 0.9rem;
    transition: all 0.2s ease-in-out;
  }
  .input-field:focus {
    outline: none;
    border-color: #6366f1;
    background-color: #fff;
    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15);
  }
  .input-field::placeholder {
    color: #94a3b8;
  }
  .animate-fadeIn {
    animation: fadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  }
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(-8px); }
    to { opacity: 1; transform: translateY(0); }
  }
`;

const styleSheet = document.createElement("style");
styleSheet.innerText = inputStyles;
document.head.appendChild(styleSheet);