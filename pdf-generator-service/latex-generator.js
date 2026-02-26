/**
 * LaTeX Resume Generator
 * Generates a professional, single-page LaTeX resume from structured JSON data.
 */

/**
 * Escapes special LaTeX characters in a string.
 * Uses a single-pass regex to avoid re-escaping issues.
 */
function escapeLatex(text) {
  if (!text) return '';
  return String(text).replace(/[\\&%$#_{}~^]/g, (char) => {
    switch (char) {
      case '\\': return '\\textbackslash{}';
      case '&': return '\\&';
      case '%': return '\\%';
      case '$': return '\\$';
      case '#': return '\\#';
      case '_': return '\\_';
      case '{': return '\\{';
      case '}': return '\\}';
      case '~': return '\\textasciitilde{}';
      case '^': return '\\textasciicircum{}';
      default: return char;
    }
  });
}

/**
 * Sanitizes a URL for use in LaTeX \href commands.
 * Backslashes are replaced with forward slashes since they're
 * not valid URL characters and would break LaTeX commands.
 */
function escapeUrl(url) {
  if (!url) return '';
  return String(url)
    .replace(/\\/g, '/')
    .replace(/%/g, '\\%')
    .replace(/#/g, '\\#');
}

/**
 * Generates a complete LaTeX document string from structured resume data.
 */
function generateLatex(data) {
  const lines = [];

  // --- Preamble ---
  lines.push('\\documentclass[10pt,a4paper]{article}');
  lines.push('\\usepackage[left=12.7mm,right=12.7mm,top=12.7mm,bottom=12.7mm]{geometry}');
  lines.push('\\usepackage{enumitem}');
  lines.push('\\usepackage[hidelinks]{hyperref}');
  lines.push('\\usepackage{titlesec}');
  lines.push('\\usepackage{parskip}');
  lines.push('\\usepackage{fontenc}');
  lines.push('\\usepackage{lmodern}');
  lines.push('');
  lines.push('% Compact spacing');
  lines.push('\\setlength{\\parindent}{0pt}');
  lines.push('\\setlength{\\parskip}{2pt}');
  lines.push('\\pagestyle{empty}');
  lines.push('');
  lines.push('% Section formatting');
  lines.push('\\titleformat{\\section}{\\large\\bfseries\\scshape}{}{0em}{}[\\titlerule]');
  lines.push('\\titlespacing*{\\section}{0pt}{6pt}{4pt}');
  lines.push('');
  lines.push('% Tight lists');
  lines.push('\\setlist[itemize]{leftmargin=*, nosep, topsep=0pt, partopsep=0pt}');
  lines.push('');
  lines.push('\\begin{document}');
  lines.push('');

  // --- Header ---
  lines.push('\\begin{center}');
  lines.push(`{\\LARGE\\bfseries ${escapeLatex(data.name || 'Resume')}} \\\\[2pt]`);
  if (data.title) {
    lines.push(`{\\large ${escapeLatex(data.title)}} \\\\[2pt]`);
  }

  const contactParts = [];
  if (data.email) contactParts.push(`\\href{mailto:${escapeUrl(data.email)}}{${escapeLatex(data.email)}}`);
  if (data.phone) contactParts.push(escapeLatex(data.phone));
  if (data.location) contactParts.push(escapeLatex(data.location));
  if (contactParts.length > 0) {
    lines.push(`${contactParts.join(' \\textbar{} ')} \\\\[2pt]`);
  }

  if (data.socials && data.socials.length > 0) {
    const socialParts = data.socials.map(s =>
      s.url ? `\\href{${escapeUrl(s.url)}}{${escapeLatex(s.platform)}}` : escapeLatex(s.platform)
    );
    lines.push(`${socialParts.join(' \\textbar{} ')}`);
  }
  lines.push('\\end{center}');
  lines.push('');

  // --- Summary ---
  if (data.summary) {
    lines.push('\\section{Summary}');
    lines.push(escapeLatex(data.summary));
    lines.push('');
  }

  // --- Experience ---
  if (data.experience && data.experience.length > 0) {
    lines.push('\\section{Work Experience}');
    data.experience.forEach((exp) => {
      const headerParts = [];
      if (exp.role) headerParts.push(`\\textbf{${escapeLatex(exp.role)}}`);
      if (exp.company) headerParts.push(escapeLatex(exp.company));
      let header = headerParts.join(' --- ');
      if (exp.dates) {
        header += ` \\hfill ${escapeLatex(exp.dates)}`;
      }
      lines.push(header + ' \\\\');
      if (exp.location) {
        lines.push(`\\textit{${escapeLatex(exp.location)}}`);
      }
      if (exp.bullets && exp.bullets.length > 0) {
        lines.push('\\begin{itemize}');
        exp.bullets.forEach(bullet => {
          lines.push(`  \\item ${escapeLatex(bullet)}`);
        });
        lines.push('\\end{itemize}');
      }
      lines.push('');
    });
  }

  // --- Education ---
  if (data.education && data.education.length > 0) {
    lines.push('\\section{Education}');
    data.education.forEach((edu) => {
      let header = `\\textbf{${escapeLatex(edu.degree)}} --- ${escapeLatex(edu.school)}`;
      if (edu.dates) {
        header += ` \\hfill ${escapeLatex(edu.dates)}`;
      }
      lines.push(header + ' \\\\');
      if (edu.location) {
        lines.push(`\\textit{${escapeLatex(edu.location)}}`);
      }
      lines.push('');
    });
  }

  // --- Skills ---
  if (data.skills && data.skills.length > 0) {
    lines.push('\\section{Skills}');
    lines.push(data.skills.map(s => escapeLatex(s)).join(', '));
    lines.push('');
  }

  // --- Projects ---
  if (data.projects && data.projects.length > 0) {
    lines.push('\\section{Projects}');
    data.projects.forEach((proj) => {
      let header = `\\textbf{${escapeLatex(proj.name)}}`;
      if (proj.url) {
        header += ` \\hfill \\href{${escapeUrl(proj.url)}}{Link}`;
      }
      lines.push(header + ' \\\\');
      if (proj.technologies && proj.technologies.length > 0) {
        lines.push(`\\textit{${proj.technologies.map(t => escapeLatex(t)).join(', ')}}`);
      }
      if (proj.description) {
        lines.push(escapeLatex(proj.description));
      }
      lines.push('');
    });
  }

  // --- Certifications ---
  if (data.certifications && data.certifications.length > 0) {
    lines.push('\\section{Certifications}');
    data.certifications.forEach((cert) => {
      let line = `\\textbf{${escapeLatex(cert.name)}} --- ${escapeLatex(cert.issuingOrganization)}`;
      if (cert.date) {
        line += ` \\hfill ${escapeLatex(cert.date)}`;
      }
      lines.push(line + ' \\\\');
    });
    lines.push('');
  }

  // --- Languages ---
  if (data.languages && data.languages.length > 0) {
    lines.push('\\section{Languages}');
    const langParts = data.languages.map(l =>
      `\\textbf{${escapeLatex(l.language)}} (${escapeLatex(l.proficiency)})`
    );
    lines.push(langParts.join(', '));
    lines.push('');
  }

  // --- Interests ---
  if (data.interests && data.interests.length > 0) {
    lines.push('\\section{Interests}');
    lines.push(data.interests.map(i => escapeLatex(i)).join(', '));
    lines.push('');
  }

  lines.push('\\end{document}');

  return lines.join('\n');
}

module.exports = { generateLatex, escapeLatex };
