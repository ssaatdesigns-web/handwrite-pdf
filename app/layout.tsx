import "./globals.css";

export const metadata = {
  title: "Text PDF → Handwritten PDF",
  description: "Convert text-based PDFs into a handwritten-style PDF with options."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="container">
          <header className="header">
            <h1>Text PDF → Handwritten PDF</h1>
            <p className="muted">
              Upload a text-based PDF, choose paper + pen + handwriting style, download result.
            </p>
          </header>
          {children}
          <footer className="footer muted">
            Works best with text PDFs. Scanned PDFs are not supported.
          </footer>
        </div>
      </body>
    </html>
  );
}
