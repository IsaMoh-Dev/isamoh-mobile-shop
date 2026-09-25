import Navbar  from './Navbar';
import Footer  from './Footer';
import FloatButtons from './FloatButtons';

export default function Layout({ children }) {
  return (
    <>
      <Navbar />
      <main id="main-site">{children}</main>
      <FloatButtons />
      <Footer />
    </>
  );
}
