import io
from django.template.loader import get_template
from xhtml2pdf import pisa
from django.http import HttpResponse

class PDFService:
    @staticmethod
    def generate_pdf(template_src, context_dict):
        """
        Generate PDF from Django template and context.
        Returns bytes content of the PDF.
        """
        template = get_template(template_src)
        html  = template.render(context_dict)
        result = io.BytesIO()
        
        # Converts HTML to PDF
        pdf = pisa.pisaDocument(io.BytesIO(html.encode("UTF-8")), result)
        
        if not pdf.err:
            return result.getvalue()
        return None

    @staticmethod
    def render_to_response(template_src, context_dict, filename="document.pdf"):
        """
        Helper to return a generic Http Response for PDF download/view
        """
        pdf_content = PDFService.generate_pdf(template_src, context_dict)
        if pdf_content:
            response = HttpResponse(pdf_content, content_type='application/pdf')
            response['Content-Disposition'] = f'inline; filename="{filename}"'
            return response
        return HttpResponse("Error generating PDF", status=500)
