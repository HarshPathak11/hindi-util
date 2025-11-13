interface PDFPreviewProps {
  headerText: string;
  bodyText: string;
  footerText: string;
}

export default function PDFPreview({ headerText, bodyText, footerText }: PDFPreviewProps) {
  return (
    <div className="aspect-a4 bg-white text-black p-8 rounded text-sm leading-relaxed relative min-h-96 font-hindi">
      {/* Header */}
      {headerText && (
        <div className="mb-6 text-left text-xs font-medium whitespace-pre-wrap">
          {headerText}
        </div>
      )}

      {/* Body */}
      <div className="text-justify whitespace-pre-wrap text-sm leading-7">
        {bodyText}
      </div>

      {/* Footer */}
      {footerText && (
        <div className="absolute bottom-8 right-8 text-right text-xs font-medium whitespace-pre-wrap max-w-xs">
          {footerText}
        </div>
      )}
    </div>
  );
}
