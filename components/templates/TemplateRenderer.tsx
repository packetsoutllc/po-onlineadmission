import React, { forwardRef } from 'react';
import { ResumeData, TemplateType } from '../../types';
import { MapPin, Mail, Phone, Globe, Linkedin, ExternalLink, Award, Heart, User, Briefcase, FolderGit2 } from 'lucide-react';

interface TemplateProps {
  data: ResumeData;
}

/* -------------------------------------------------------------------------- */
/*                               MODERN TEMPLATE                              */
/* -------------------------------------------------------------------------- */
const ModernTemplate: React.FC<TemplateProps> = ({ data }) => {
  return (
    <div className="w-full h-full bg-white flex flex-row min-h-[297mm] text-slate-800">
      {/* Sidebar */}
      <div className="w-1/3 bg-slate-900 text-slate-50 p-8 flex flex-col gap-8">
        <div className="text-center md:text-left">
           <div className="w-24 h-24 bg-slate-800 rounded-full mx-auto md:mx-0 mb-4 flex items-center justify-center text-3xl font-bold text-slate-300 border-2 border-slate-700">
             {data.personal.fullName.charAt(0) || "U"}
           </div>
           <h2 className="text-xl font-bold tracking-wide uppercase mb-2">Contact</h2>
           <div className="flex flex-col gap-3 text-sm text-slate-300">
             {data.personal.email && <div className="flex items-center gap-2 break-all"><Mail size={14}/> {data.personal.email}</div>}
             {data.personal.phone && <div className="flex items-center gap-2"><Phone size={14}/> {data.personal.phone}</div>}
             {data.personal.location && <div className="flex items-center gap-2"><MapPin size={14}/> {data.personal.location}</div>}
             {data.personal.website && <div className="flex items-center gap-2 break-all"><Globe size={14}/> {data.personal.website}</div>}
             {data.personal.linkedin && <div className="flex items-center gap-2 break-all"><Linkedin size={14}/> {data.personal.linkedin.replace('https://', '')}</div>}
           </div>
        </div>

        {/* Skills */}
        <div>
          <h2 className="text-xl font-bold tracking-wide uppercase border-b border-slate-700 pb-2 mb-4">Skills</h2>
          <div className="flex flex-wrap gap-2">
            {data.skills.map((skill, i) => (
              <span key={i} className="px-2 py-1 bg-slate-800 text-xs rounded-md text-slate-200 border border-slate-700">{skill}</span>
            ))}
          </div>
        </div>

        {/* Education (Sidebar style) */}
        <div>
          <h2 className="text-xl font-bold tracking-wide uppercase border-b border-slate-700 pb-2 mb-4">Education</h2>
          <div className="flex flex-col gap-4">
             {data.education.map(edu => (
               <div key={edu.id}>
                 <h3 className="font-bold text-white">{edu.degree}</h3>
                 <p className="text-sm text-slate-400">{edu.institution}</p>
                 <p className="text-xs text-slate-500">{edu.startDate} - {edu.endDate}</p>
               </div>
             ))}
          </div>
        </div>

        {/* Languages */}
        {data.languages.length > 0 && (
            <div>
              <h2 className="text-xl font-bold tracking-wide uppercase border-b border-slate-700 pb-2 mb-4">Languages</h2>
              <div className="flex flex-col gap-2">
                {data.languages.map((lang, i) => (
                  <div key={i} className="flex justify-between text-sm text-slate-300">
                    <span>{lang.language}</span>
                    <span className="opacity-70 text-xs pt-0.5">{lang.proficiency}</span>
                  </div>
                ))}
              </div>
            </div>
        )}
      </div>

      {/* Main Content */}
      <div className="w-2/3 p-10 bg-white">
        <div className="mb-10">
          <h1 className="text-4xl font-bold text-slate-900 uppercase tracking-tight leading-none mb-2">{data.personal.fullName}</h1>
          <p className="text-lg text-blue-600 font-medium uppercase tracking-widest">{data.personal.jobTitle}</p>
          <p className="mt-4 text-slate-600 leading-relaxed text-sm">{data.personal.summary}</p>
        </div>

        {/* Experience */}
        <div className="mb-10">
          <h2 className="text-xl font-bold text-slate-900 uppercase border-b-2 border-slate-200 pb-2 mb-6 flex items-center gap-2">
            <span className="w-2 h-8 bg-blue-600 rounded-sm"></span> Experience
          </h2>
          <div className="flex flex-col gap-8">
            {data.experience.map(exp => (
              <div key={exp.id}>
                <div className="flex justify-between items-baseline mb-1">
                  <h3 className="text-lg font-bold text-slate-800">{exp.position}</h3>
                  <span className="text-sm font-medium text-slate-500 whitespace-nowrap">{exp.startDate} – {exp.current ? 'Present' : exp.endDate}</span>
                </div>
                <p className="text-blue-600 font-semibold text-sm mb-2">{exp.company} {exp.location && `| ${exp.location}`}</p>
                <p className="text-sm text-slate-600 whitespace-pre-line leading-relaxed">{exp.description}</p>
              </div>
            ))}
          </div>
        </div>

         {/* Projects */}
         {data.projects.length > 0 && (
            <div className="mb-10">
              <h2 className="text-xl font-bold text-slate-900 uppercase border-b-2 border-slate-200 pb-2 mb-6 flex items-center gap-2">
                <span className="w-2 h-8 bg-blue-600 rounded-sm"></span> Projects
              </h2>
              <div className="grid grid-cols-1 gap-5">
                {data.projects.map(proj => (
                  <div key={proj.id} className="bg-slate-50 p-4 rounded border border-slate-100">
                    <div className="flex justify-between items-start">
                      <h3 className="font-bold text-slate-800">{proj.name}</h3>
                      {proj.link && <span className="text-blue-500 text-xs truncate">{proj.link}</span>}
                    </div>
                    <p className="text-xs text-blue-600 mb-2 font-mono">{proj.technologies}</p>
                    <p className="text-sm text-slate-600">{proj.description}</p>
                  </div>
                ))}
              </div>
            </div>
         )}

         {/* Certifications */}
         {data.certifications.length > 0 && (
            <div>
              <h2 className="text-xl font-bold text-slate-900 uppercase border-b-2 border-slate-200 pb-2 mb-6 flex items-center gap-2">
                <span className="w-2 h-8 bg-blue-600 rounded-sm"></span> Certifications
              </h2>
              <div className="grid grid-cols-2 gap-4">
                 {data.certifications.map(cert => (
                   <div key={cert.id} className="text-sm">
                     <p className="font-bold text-slate-800">{cert.name}</p>
                     <p className="text-slate-500 text-xs">{cert.issuer} | {cert.date}</p>
                   </div>
                 ))}
              </div>
            </div>
         )}
      </div>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/*                              CREATIVE TEMPLATE                             */
/* -------------------------------------------------------------------------- */
const CreativeTemplate: React.FC<TemplateProps> = ({ data }) => {
  return (
    <div className="w-full h-full bg-white text-gray-800 font-sans min-h-[297mm]">
      <div className="relative bg-teal-600 text-white p-12 pb-20 clip-path-header">
         <h1 className="text-6xl font-extrabold mb-2 tracking-tight">{data.personal.fullName}</h1>
         <p className="text-2xl opacity-90 font-light tracking-wide">{data.personal.jobTitle}</p>
         <div className="flex flex-wrap gap-6 mt-8 text-sm font-medium opacity-90">
            {data.personal.email && <span className="flex items-center gap-2"><Mail size={16}/> {data.personal.email}</span>}
            {data.personal.phone && <span className="flex items-center gap-2"><Phone size={16}/> {data.personal.phone}</span>}
            {data.personal.location && <span className="flex items-center gap-2"><MapPin size={16}/> {data.personal.location}</span>}
         </div>
      </div>
      
      <div className="p-12 -mt-12 grid grid-cols-12 gap-10">
        {/* Left Main Column */}
        <div className="col-span-8 space-y-10">
          <div className="bg-white p-8 rounded-xl shadow-xl border-t-4 border-teal-500">
             <h3 className="text-teal-600 font-bold uppercase tracking-wider mb-4 flex items-center gap-2"><User size={18}/> About Me</h3>
             <p className="text-gray-600 leading-relaxed">{data.personal.summary}</p>
          </div>

          <div>
            <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
              <div className="bg-teal-100 p-2 rounded-lg text-teal-600"><Briefcase size={24}/></div> Experience
            </h3>
            <div className="space-y-8 pl-4 border-l-2 border-dashed border-teal-200 ml-3">
               {data.experience.map(exp => (
                 <div key={exp.id} className="relative pl-8">
                    <div className="absolute -left-[0.55rem] top-1.5 w-4 h-4 rounded-full bg-teal-500 border-4 border-white shadow-sm"></div>
                    <h4 className="font-bold text-xl text-gray-800">{exp.position}</h4>
                    <p className="text-teal-600 font-semibold mb-2">{exp.company} <span className="text-gray-400 font-normal text-sm">| {exp.startDate} - {exp.current ? 'Present' : exp.endDate}</span></p>
                    <p className="text-gray-600 leading-relaxed">{exp.description}</p>
                 </div>
               ))}
            </div>
          </div>

           <div>
            <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
              <div className="bg-teal-100 p-2 rounded-lg text-teal-600"><FolderGit2 size={24}/></div> Projects
            </h3>
            <div className="grid grid-cols-2 gap-5">
              {data.projects.map(proj => (
                 <div key={proj.id} className="bg-slate-50 p-5 rounded-lg border border-slate-100 hover:shadow-md transition-shadow">
                    <h4 className="font-bold text-gray-800 mb-1">{proj.name}</h4>
                    <p className="text-xs text-teal-500 mb-3 font-mono bg-teal-50 inline-block px-1 rounded">{proj.technologies}</p>
                    <p className="text-sm text-gray-600 line-clamp-4">{proj.description}</p>
                 </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Sidebar Column */}
        <div className="col-span-4 space-y-10 pt-6">
           <div>
              <h3 className="text-lg font-bold text-gray-800 uppercase mb-5 border-b-2 border-teal-100 inline-block pb-1">Education</h3>
              <div className="space-y-6">
                {data.education.map(edu => (
                  <div key={edu.id} className="bg-slate-50 p-4 rounded-lg">
                    <p className="font-bold text-gray-800">{edu.degree}</p>
                    <p className="text-sm text-teal-600 font-medium">{edu.institution}</p>
                    <p className="text-xs text-gray-400 mt-1">{edu.startDate} - {edu.endDate}</p>
                  </div>
                ))}
              </div>
           </div>

           <div>
              <h3 className="text-lg font-bold text-gray-800 uppercase mb-5 border-b-2 border-teal-100 inline-block pb-1">Expertise</h3>
              <div className="flex flex-wrap gap-2">
                 {data.skills.map((skill, i) => (
                   <span key={i} className="px-3 py-1.5 bg-teal-50 text-teal-700 rounded-lg text-sm font-semibold border border-teal-100 shadow-sm">{skill}</span>
                 ))}
              </div>
           </div>

           {data.certifications.length > 0 && (
             <div>
                <h3 className="text-lg font-bold text-gray-800 uppercase mb-5 border-b-2 border-teal-100 inline-block pb-1">Certifications</h3>
                <div className="space-y-3">
                   {data.certifications.map(cert => (
                      <div key={cert.id} className="text-sm">
                         <p className="font-bold text-gray-700">{cert.name}</p>
                         <p className="text-xs text-gray-500">{cert.issuer}</p>
                      </div>
                   ))}
                </div>
             </div>
           )}

           {data.interests.length > 0 && (
              <div>
                <h3 className="text-lg font-bold text-gray-800 uppercase mb-5 border-b-2 border-teal-100 inline-block pb-1">Interests</h3>
                <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-gray-600">
                   {data.interests.map((int, i) => <span key={i}>• {int}</span>)}
                </div>
              </div>
           )}
        </div>
      </div>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/*                            PROFESSIONAL TEMPLATE                           */
/* -------------------------------------------------------------------------- */
const ProfessionalTemplate: React.FC<TemplateProps> = ({ data }) => {
  return (
    <div className="w-full h-full bg-white text-black font-serif p-14 min-h-[297mm] max-w-[210mm] mx-auto">
      {/* Header */}
      <div className="border-b-4 border-gray-800 pb-6 mb-8">
         <h1 className="text-5xl font-bold uppercase tracking-tight mb-3 text-gray-900">{data.personal.fullName}</h1>
         <div className="text-lg italic text-gray-700 mb-4">{data.personal.jobTitle}</div>
         <div className="text-sm flex flex-wrap gap-y-2 text-gray-600 font-sans">
            {data.personal.email && <span className="mr-4 flex items-center gap-1"><Mail size={12}/> {data.personal.email}</span>}
            {data.personal.phone && <span className="mr-4 flex items-center gap-1"><Phone size={12}/> {data.personal.phone}</span>}
            {data.personal.location && <span className="mr-4 flex items-center gap-1"><MapPin size={12}/> {data.personal.location}</span>}
            {data.personal.linkedin && <span className="mr-4 flex items-center gap-1"><Linkedin size={12}/> {data.personal.linkedin}</span>}
         </div>
      </div>

      {/* Summary */}
      {data.personal.summary && (
        <div className="mb-8">
          <h2 className="text-sm font-bold uppercase border-b border-gray-300 mb-3 text-gray-500 font-sans tracking-wider">Professional Summary</h2>
          <p className="text-base leading-relaxed text-justify text-gray-800">{data.personal.summary}</p>
        </div>
      )}

      {/* Experience */}
      <div className="mb-8">
        <h2 className="text-sm font-bold uppercase border-b border-gray-300 mb-4 text-gray-500 font-sans tracking-wider">Work History</h2>
        <div className="space-y-6">
          {data.experience.map(exp => (
            <div key={exp.id}>
              <div className="flex justify-between font-bold text-lg mb-1 text-gray-900">
                 <span>{exp.company}, {exp.location}</span>
                 <span className="font-sans text-base font-normal text-gray-600">{exp.startDate} – {exp.current ? 'Present' : exp.endDate}</span>
              </div>
              <div className="italic text-base mb-2 font-semibold text-gray-700">{exp.position}</div>
              <p className="text-sm leading-relaxed text-justify whitespace-pre-line text-gray-800">{exp.description}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-8">
        <div className="col-span-2">
            {/* Education */}
            <div className="mb-8">
                <h2 className="text-sm font-bold uppercase border-b border-gray-300 mb-4 text-gray-500 font-sans tracking-wider">Education</h2>
                <div className="space-y-4">
                {data.education.map(edu => (
                    <div key={edu.id}>
                       <div className="flex justify-between items-baseline">
                           <span className="font-bold text-lg text-gray-900">{edu.institution}</span>
                           <span className="text-sm text-gray-600">{edu.startDate} – {edu.endDate}</span>
                       </div>
                       <div className="italic">{edu.degree}</div>
                       {edu.score && <div className="text-sm text-gray-600">Grade: {edu.score}</div>}
                    </div>
                ))}
                </div>
            </div>

            {/* Projects */}
             {data.projects.length > 0 && (
                <div>
                <h2 className="text-sm font-bold uppercase border-b border-gray-300 mb-3 text-gray-500 font-sans tracking-wider">Key Projects</h2>
                <ul className="list-disc pl-5 text-sm space-y-2 text-gray-800">
                    {data.projects.map(proj => (
                        <li key={proj.id}>
                        <span className="font-bold">{proj.name}:</span> {proj.description}
                        </li>
                    ))}
                </ul>
                </div>
            )}
        </div>

        <div className="col-span-1 bg-gray-50 p-4 -mt-4 -mb-4 rounded">
             {/* Skills */}
             <div className="mb-6">
                <h2 className="text-sm font-bold uppercase border-b border-gray-300 mb-3 text-gray-500 font-sans tracking-wider">Core Skills</h2>
                <div className="flex flex-col gap-1 text-sm font-medium text-gray-800">
                    {data.skills.map(s => <span key={s}>• {s}</span>)}
                </div>
             </div>

             {/* Languages */}
             {data.languages.length > 0 && (
                <div className="mb-6">
                    <h2 className="text-sm font-bold uppercase border-b border-gray-300 mb-3 text-gray-500 font-sans tracking-wider">Languages</h2>
                    <div className="space-y-1 text-sm">
                        {data.languages.map(l => (
                            <div key={l.id}>
                                <span className="font-bold">{l.language}</span>
                                <span className="block text-xs text-gray-500">{l.proficiency}</span>
                            </div>
                        ))}
                    </div>
                </div>
             )}

             {/* Certs */}
             {data.certifications.length > 0 && (
                <div>
                    <h2 className="text-sm font-bold uppercase border-b border-gray-300 mb-3 text-gray-500 font-sans tracking-wider">Certifications</h2>
                    <div className="space-y-2 text-sm">
                        {data.certifications.map(c => (
                            <div key={c.id}>
                                <span className="font-bold block">{c.name}</span>
                                <span className="text-xs text-gray-500">{c.issuer}, {c.date}</span>
                            </div>
                        ))}
                    </div>
                </div>
             )}
        </div>
      </div>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/*                            MINIMALIST TEMPLATE                             */
/* -------------------------------------------------------------------------- */
const MinimalistTemplate: React.FC<TemplateProps> = ({ data }) => {
  return (
    <div className="w-full h-full bg-white text-neutral-800 font-sans p-16 min-h-[297mm]">
      <div className="flex justify-between items-end mb-16 border-b border-neutral-100 pb-8">
        <div>
           <h1 className="text-5xl font-thin tracking-tighter mb-2 text-neutral-900">{data.personal.fullName}</h1>
           <p className="text-xl text-neutral-400 font-light tracking-wide uppercase">{data.personal.jobTitle}</p>
        </div>
        <div className="text-right text-xs text-neutral-400 font-medium tracking-widest uppercase space-y-2">
           <p>{data.personal.email}</p>
           <p>{data.personal.phone}</p>
           <p>{data.personal.location}</p>
           <p>{data.personal.website}</p>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-12">
         <div className="col-span-4 space-y-12">
             <div>
               <h3 className="font-bold text-xs uppercase tracking-[0.2em] text-neutral-900 mb-6">Education</h3>
               {data.education.map(edu => (
                 <div key={edu.id} className="mb-6 last:mb-0">
                   <div className="font-normal text-neutral-800">{edu.institution}</div>
                   <div className="text-sm text-neutral-500 italic mb-1">{edu.degree}</div>
                   <div className="text-xs text-neutral-400">{edu.startDate} — {edu.endDate}</div>
                 </div>
               ))}
             </div>
             <div>
               <h3 className="font-bold text-xs uppercase tracking-[0.2em] text-neutral-900 mb-6">Skills</h3>
               <div className="flex flex-col gap-3">
                 {data.skills.map((skill, i) => <span key={i} className="text-sm border-b border-dotted border-neutral-200 pb-1 text-neutral-600">{skill}</span>)}
               </div>
             </div>
             {data.languages.length > 0 && (
                <div>
                    <h3 className="font-bold text-xs uppercase tracking-[0.2em] text-neutral-900 mb-6">Languages</h3>
                    {data.languages.map(lang => (
                        <div key={lang.id} className="flex justify-between text-sm mb-2">
                            <span className="text-neutral-700">{lang.language}</span>
                            <span className="text-neutral-400 text-xs">{lang.proficiency}</span>
                        </div>
                    ))}
                </div>
             )}
         </div>

         <div className="col-span-8 space-y-14">
            <div>
               <h3 className="font-bold text-xs uppercase tracking-[0.2em] text-neutral-900 mb-6">Profile</h3>
               <p className="text-neutral-600 leading-loose text-sm font-light">{data.personal.summary}</p>
            </div>

            <div>
               <h3 className="font-bold text-xs uppercase tracking-[0.2em] text-neutral-900 mb-8">Experience</h3>
               <div className="space-y-10 border-l border-neutral-100 pl-8">
                 {data.experience.map(exp => (
                   <div key={exp.id} className="group relative">
                      <div className="absolute -left-[2.35rem] top-1.5 h-2 w-2 rounded-full bg-neutral-200 group-hover:bg-neutral-400 transition-colors"></div>
                      <div className="flex justify-between mb-2 items-baseline">
                         <h4 className="font-medium text-lg text-neutral-800">{exp.position}</h4>
                         <span className="text-xs text-neutral-400 font-mono">{exp.startDate} — {exp.current ? 'Present' : exp.endDate}</span>
                      </div>
                      <div className="text-neutral-500 mb-3 text-sm uppercase tracking-wide">{exp.company}</div>
                      <p className="text-sm text-neutral-600 leading-relaxed font-light">{exp.description}</p>
                   </div>
                 ))}
               </div>
            </div>

             {data.projects.length > 0 && (
              <div>
                <h3 className="font-bold text-xs uppercase tracking-[0.2em] text-neutral-900 mb-8">Projects</h3>
                <div className="grid grid-cols-2 gap-8">
                  {data.projects.map(proj => (
                    <div key={proj.id}>
                       <h4 className="font-medium text-neutral-800">{proj.name}</h4>
                       <p className="text-[10px] text-neutral-400 mb-2 uppercase tracking-wider mt-1">{proj.technologies}</p>
                       <p className="text-sm text-neutral-600 font-light">{proj.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
         </div>
      </div>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/*                               ELEGANT TEMPLATE                             */
/* -------------------------------------------------------------------------- */
const ElegantTemplate: React.FC<TemplateProps> = ({ data }) => {
    return (
      <div className="w-full h-full bg-[#fffcf8] text-slate-800 font-serif p-0 min-h-[297mm]">
        <div className="h-4 bg-slate-800 w-full"></div>
        <div className="px-16 py-12">
            <div className="text-center border-b double border-slate-200 pb-10 mb-10">
                <h1 className="text-5xl font-playfair font-bold text-slate-800 mb-4">{data.personal.fullName}</h1>
                <div className="flex justify-center items-center gap-3 text-slate-500 font-sans text-sm tracking-widest uppercase">
                    <span>{data.personal.jobTitle}</span>
                </div>
                <div className="flex justify-center items-center gap-6 mt-6 text-sm font-sans text-slate-600">
                    {data.personal.email && <span>{data.personal.email}</span>}
                    {data.personal.phone && <span>{data.personal.phone}</span>}
                    {data.personal.location && <span>{data.personal.location}</span>}
                </div>
            </div>

            <div className="grid grid-cols-3 gap-10">
                 <div className="col-span-1 space-y-8 border-r border-slate-100 pr-8 text-right">
                    {data.education.length > 0 && (
                        <section>
                            <h3 className="font-sans font-bold text-xs uppercase tracking-widest text-slate-400 mb-4">Education</h3>
                            {data.education.map(edu => (
                                <div key={edu.id} className="mb-4">
                                    <div className="font-bold text-slate-700">{edu.institution}</div>
                                    <div className="italic text-sm text-slate-600">{edu.degree}</div>
                                    <div className="text-xs text-slate-400 mt-1 font-sans">{edu.startDate} - {edu.endDate}</div>
                                </div>
                            ))}
                        </section>
                    )}

                    <section>
                        <h3 className="font-sans font-bold text-xs uppercase tracking-widest text-slate-400 mb-4">Skills</h3>
                        <div className="flex flex-wrap justify-end gap-2">
                           {data.skills.map((s, i) => <span key={i} className="text-sm text-slate-600">{s}</span>)}
                        </div>
                    </section>

                    {data.languages.length > 0 && (
                        <section>
                            <h3 className="font-sans font-bold text-xs uppercase tracking-widest text-slate-400 mb-4">Languages</h3>
                            {data.languages.map(l => (
                                <div key={l.id} className="mb-2">
                                    <div className="text-slate-700 font-medium">{l.language}</div>
                                    <div className="text-xs text-slate-400">{l.proficiency}</div>
                                </div>
                            ))}
                        </section>
                    )}
                 </div>

                 <div className="col-span-2 space-y-10">
                     <section>
                         <h3 className="font-sans font-bold text-xs uppercase tracking-widest text-slate-400 mb-4">Profile</h3>
                         <p className="leading-loose text-slate-600">{data.personal.summary}</p>
                     </section>

                     <section>
                         <h3 className="font-sans font-bold text-xs uppercase tracking-widest text-slate-400 mb-6">Experience</h3>
                         <div className="space-y-8">
                            {data.experience.map(exp => (
                                <div key={exp.id}>
                                    <div className="flex justify-between items-baseline mb-2">
                                        <h4 className="text-xl font-bold text-slate-800">{exp.position}</h4>
                                        <span className="font-sans text-xs text-slate-400">{exp.startDate} - {exp.current ? 'Present' : exp.endDate}</span>
                                    </div>
                                    <div className="text-slate-500 italic mb-3 text-sm">{exp.company}</div>
                                    <p className="text-slate-600 leading-relaxed text-sm">{exp.description}</p>
                                </div>
                            ))}
                         </div>
                     </section>
                     
                     {data.certifications.length > 0 && (
                        <section>
                            <h3 className="font-sans font-bold text-xs uppercase tracking-widest text-slate-400 mb-6">Certifications</h3>
                            <div className="grid grid-cols-2 gap-4">
                                {data.certifications.map(c => (
                                    <div key={c.id} className="bg-white p-3 border border-slate-100 shadow-sm">
                                        <div className="font-bold text-sm text-slate-700">{c.name}</div>
                                        <div className="text-xs text-slate-500 mt-1">{c.issuer} • {c.date}</div>
                                    </div>
                                ))}
                            </div>
                        </section>
                     )}
                 </div>
            </div>
        </div>
      </div>
    );
};

/* -------------------------------------------------------------------------- */
/*                                 TECH TEMPLATE                              */
/* -------------------------------------------------------------------------- */
const TechTemplate: React.FC<TemplateProps> = ({ data }) => {
    return (
      <div className="w-full h-full bg-[#1e1e1e] text-[#d4d4d4] font-mono p-8 min-h-[297mm]">
         <div className="border border-[#333] p-8 h-full rounded-lg shadow-2xl bg-[#252526]">
            {/* Header */}
            <div className="flex gap-4 mb-8 pb-6 border-b border-[#333]">
               <div className="text-[#569cd6] text-6xl font-bold">{'<'}</div>
               <div className="flex-1">
                   <h1 className="text-4xl font-bold text-[#4ec9b0] mb-2">{data.personal.fullName}</h1>
                   <p className="text-[#ce9178] text-xl">"{data.personal.jobTitle}"</p>
                   <div className="mt-4 flex flex-wrap gap-4 text-xs text-[#6a9955]">
                       <span>// {data.personal.email}</span>
                       <span>// {data.personal.location}</span>
                       <span>// {data.personal.website}</span>
                   </div>
               </div>
               <div className="text-[#569cd6] text-6xl font-bold self-end">{'>'}</div>
            </div>

            <div className="grid grid-cols-12 gap-8">
                <div className="col-span-4 space-y-8">
                    <div className="bg-[#1e1e1e] p-4 rounded border border-[#333]">
                        <h3 className="text-[#dcdcaa] mb-4 font-bold">const skills = [</h3>
                        <div className="pl-4 flex flex-wrap gap-2">
                            {data.skills.map((s, i) => (
                                <span key={i} className="text-[#9cdcfe]">"{s}"<span className="text-[#d4d4d4]">,</span></span>
                            ))}
                        </div>
                        <h3 className="text-[#dcdcaa] mt-2 font-bold">];</h3>
                    </div>

                    <div className="bg-[#1e1e1e] p-4 rounded border border-[#333]">
                         <h3 className="text-[#c586c0] mb-4 font-bold">interface Education {'{'}</h3>
                         <div className="pl-4 space-y-4">
                            {data.education.map(edu => (
                                <div key={edu.id}>
                                    <div className="text-[#4ec9b0]">{edu.institution}: <span className="text-[#ce9178]">"{edu.degree}"</span>;</div>
                                    <div className="text-[#6a9955] text-xs">// {edu.startDate} - {edu.endDate}</div>
                                </div>
                            ))}
                         </div>
                         <h3 className="text-[#c586c0] mt-2 font-bold">{'}'}</h3>
                    </div>
                </div>

                <div className="col-span-8 space-y-8">
                     <div className="bg-[#1e1e1e] p-6 rounded border border-[#333]">
                        <h3 className="text-[#569cd6] mb-2 font-bold">function <span className="text-[#dcdcaa]">getSummary</span>() {'{'}</h3>
                        <div className="pl-4 py-2 text-[#ce9178] border-l-2 border-[#333] ml-2">
                            return "{data.personal.summary}";
                        </div>
                        <h3 className="text-[#569cd6] mt-2 font-bold">{'}'}</h3>
                     </div>

                     <div>
                         <h3 className="text-[#c586c0] font-bold text-xl mb-4">class Experience extends Career {'{'}</h3>
                         <div className="space-y-6 pl-4 border-l border-[#333] ml-4">
                             {data.experience.map(exp => (
                                 <div key={exp.id}>
                                     <div className="flex items-center gap-2 mb-1">
                                         <span className="text-[#569cd6]">public</span>
                                         <span className="text-[#dcdcaa] font-bold">{exp.company.replace(/\s/g, '')}</span>
                                         <span className="text-[#d4d4d4]">( ) :</span>
                                         <span className="text-[#4ec9b0]">{exp.position}</span>
                                     </div>
                                     <div className="text-[#6a9955] text-xs mb-2">// {exp.startDate} - {exp.current ? 'Present' : exp.endDate}</div>
                                     <p className="text-[#9cdcfe] text-sm pl-4 border-l border-[#444]">/* {exp.description} */</p>
                                 </div>
                             ))}
                         </div>
                         <h3 className="text-[#c586c0] font-bold text-xl mt-4">{'}'}</h3>
                     </div>
                </div>
            </div>
         </div>
      </div>
    );
};


export const TemplateRenderer = forwardRef<HTMLDivElement, { data: ResumeData; template: TemplateType }>((props, ref) => {
  const { data, template } = props;

  const renderTemplate = () => {
    switch (template) {
      case 'modern': return <ModernTemplate data={data} />;
      case 'creative': return <CreativeTemplate data={data} />;
      case 'professional': return <ProfessionalTemplate data={data} />;
      case 'minimalist': return <MinimalistTemplate data={data} />;
      case 'elegant': return <ElegantTemplate data={data} />;
      case 'tech': return <TechTemplate data={data} />;
      default: return <ModernTemplate data={data} />;
    }
  };

  return (
    <div ref={ref} className="w-full h-full print-container bg-white shadow-2xl origin-top transform transition-transform duration-200">
      {renderTemplate()}
    </div>
  );
});

TemplateRenderer.displayName = 'TemplateRenderer';