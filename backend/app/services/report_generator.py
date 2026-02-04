"""
Report Generator Service - Generate PDF reports for candidates.
"""

import os
from datetime import datetime
from typing import Dict, Any
import asyncio

from app.config import settings


class ReportGeneratorService:
    """Service for generating candidate reports in PDF format."""
    
    def __init__(self):
        self.reports_dir = os.path.join(settings.UPLOAD_DIR, "reports")
        os.makedirs(self.reports_dir, exist_ok=True)
    
    async def generate_pdf(self, report_data: Dict[str, Any]) -> str:
        """
        Generate a PDF report for a candidate.
        
        Args:
            report_data: Dictionary containing candidate report data
            
        Returns:
            Path to the generated PDF file
        """
        # Generate filename
        timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
        candidate_name = report_data.get("name", "Unknown").replace(" ", "_")
        filename = f"report_{candidate_name}_{timestamp}.pdf"
        filepath = os.path.join(self.reports_dir, filename)
        
        # Generate PDF
        await self._create_pdf(report_data, filepath)
        
        return filepath
    
    async def _create_pdf(self, data: Dict[str, Any], filepath: str):
        """Create PDF using ReportLab."""
        def generate():
            from reportlab.lib import colors
            from reportlab.lib.pagesizes import letter, A4
            from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
            from reportlab.lib.units import inch
            from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
            from reportlab.platypus import HRFlowable
            
            # Create document
            doc = SimpleDocTemplate(filepath, pagesize=A4)
            styles = getSampleStyleSheet()
            story = []
            
            # Custom styles
            title_style = ParagraphStyle(
                'CustomTitle',
                parent=styles['Heading1'],
                fontSize=24,
                spaceAfter=30,
                textColor=colors.HexColor('#2563eb')
            )
            
            heading_style = ParagraphStyle(
                'CustomHeading',
                parent=styles['Heading2'],
                fontSize=14,
                spaceBefore=20,
                spaceAfter=10,
                textColor=colors.HexColor('#1e40af')
            )
            
            normal_style = ParagraphStyle(
                'CustomNormal',
                parent=styles['Normal'],
                fontSize=11,
                spaceAfter=8
            )
            
            # Title
            story.append(Paragraph("Candidate Evaluation Report", title_style))
            story.append(HRFlowable(width="100%", thickness=2, color=colors.HexColor('#2563eb')))
            story.append(Spacer(1, 20))
            
            # Candidate Information
            story.append(Paragraph("Candidate Information", heading_style))
            
            info_data = [
                ["Name:", data.get("name", "N/A")],
                ["Email:", data.get("email", "N/A")],
                ["Phone:", data.get("phone", "N/A")],
                ["Position:", data.get("job_title", "N/A")],
            ]
            
            info_table = Table(info_data, colWidths=[1.5*inch, 4*inch])
            info_table.setStyle(TableStyle([
                ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, -1), 11),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
                ('TOPPADDING', (0, 0), (-1, -1), 8),
            ]))
            story.append(info_table)
            story.append(Spacer(1, 20))
            
            # Scores Section
            story.append(Paragraph("Evaluation Scores", heading_style))
            
            # Determine score colors
            def get_score_color(score):
                if score is None:
                    return colors.gray
                if score >= 75:
                    return colors.HexColor('#10b981')
                elif score >= 60:
                    return colors.HexColor('#3b82f6')
                elif score >= 45:
                    return colors.HexColor('#f59e0b')
                else:
                    return colors.HexColor('#ef4444')
            
            final_score = data.get("final_score", 0)
            resume_score = data.get("resume_score", 0)
            sentiment_score = data.get("sentiment_score")
            confidence_score = data.get("confidence_score")
            
            scores_data = [
                ["Metric", "Score", "Status"],
                ["Final Score", f"{final_score}%", data.get("recommendation", "N/A")],
                ["Resume Match", f"{resume_score}%", "Skills & Experience"],
                ["Sentiment", f"{sentiment_score}%" if sentiment_score else "N/A", "Interview Tone"],
                ["Confidence", f"{confidence_score}%" if confidence_score else "N/A", "Communication"],
            ]
            
            scores_table = Table(scores_data, colWidths=[2*inch, 1.5*inch, 2*inch])
            scores_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#2563eb')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, -1), 11),
                ('ALIGN', (1, 0), (1, -1), 'CENTER'),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 10),
                ('TOPPADDING', (0, 0), (-1, -1), 10),
                ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#e5e7eb')),
            ]))
            story.append(scores_table)
            story.append(Spacer(1, 20))
            
            # Skills Section
            story.append(Paragraph("Skills", heading_style))
            
            skills = data.get("skills", [])
            skill_matches = data.get("skill_matches", [])
            
            if skills:
                skills_text = ", ".join(skills)
                story.append(Paragraph(f"<b>All Skills:</b> {skills_text}", normal_style))
                
                if skill_matches:
                    matched_text = ", ".join(skill_matches)
                    story.append(Paragraph(
                        f"<b>Matched Skills:</b> <font color='green'>{matched_text}</font>", 
                        normal_style
                    ))
            else:
                story.append(Paragraph("No skills data available", normal_style))
            
            story.append(Spacer(1, 10))
            
            # Education & Experience
            story.append(Paragraph("Education & Experience", heading_style))
            story.append(Paragraph(f"<b>Education:</b> {data.get('education', 'N/A')}", normal_style))
            story.append(Paragraph(f"<b>Experience:</b> {data.get('experience', 'N/A')}", normal_style))
            story.append(Spacer(1, 20))
            
            # Interview Transcript (if available)
            if data.get("transcript"):
                story.append(Paragraph("Interview Transcript", heading_style))
                transcript = data.get("transcript", "")[:500]  # Limit length
                if len(data.get("transcript", "")) > 500:
                    transcript += "..."
                story.append(Paragraph(transcript, normal_style))
                story.append(Spacer(1, 20))
            
            # Recommendation
            story.append(Paragraph("Final Recommendation", heading_style))
            
            recommendation = data.get("recommendation", "N/A")
            rec_color = colors.HexColor('#10b981') if "Recommended" in recommendation else colors.HexColor('#f59e0b')
            
            rec_style = ParagraphStyle(
                'Recommendation',
                parent=styles['Normal'],
                fontSize=16,
                textColor=rec_color,
                fontName='Helvetica-Bold'
            )
            story.append(Paragraph(recommendation, rec_style))
            story.append(Spacer(1, 30))
            
            # Footer
            story.append(HRFlowable(width="100%", thickness=1, color=colors.gray))
            footer_style = ParagraphStyle(
                'Footer',
                parent=styles['Normal'],
                fontSize=9,
                textColor=colors.gray
            )
            story.append(Paragraph(
                f"Generated on: {data.get('generated_at', datetime.utcnow().isoformat())}", 
                footer_style
            ))
            story.append(Paragraph(
                "Smart Resume Filter & AI HR Assistant - Group 40, Sinhgad Academy of Engineering", 
                footer_style
            ))
            
            # Build PDF
            doc.build(story)
        
        await asyncio.get_event_loop().run_in_executor(None, generate)
    
    async def generate_summary_report(self, job_id: str, results: list) -> str:
        """Generate a summary report for all candidates for a job."""
        # Implementation for batch report generation
        pass

