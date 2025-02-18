import { FaFacebookF, FaTwitter, FaInstagram, FaLinkedin } from "react-icons/fa";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="bg-neutral-800 text-gray-300 py-6 mt-auto w-full"> 
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Branding */}
          <div>
            <h2 className="text-2xl font-bold text-white">UnderDogs</h2>
            <p className="mt-3 text-sm">
              Helping dogs find their forever home.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-xl font-semibold text-white">Quick Links</h3>
            <ul className="mt-3 space-y-2">
              <li><Link to="/dogs" className="hover:text-yellow-400 text-decoration-none">Dogs</Link></li>
              <li><Link to="/adoption" className="hover:text-yellow-400 text-decoration-none">Adoption</Link></li>
              <li><Link to="https://fundraise.givesmart.com/f/4yx1/n?vid=1hjs8q" className="hover:text-yellow-400 text-decoration-none">Donation</Link></li>
            </ul>
          </div>

          {/* Social Media */}
          <div>
            <h3 className="text-xl font-semibold text-white">Follow Us</h3>
            <div className="flex space-x-4 mt-3">
              <a href="#" className="hover:text-blue-400"><FaFacebookF /></a>
              <a href="#" className="hover:text-blue-300"><FaTwitter /></a>
              <a href="#" className="hover:text-pink-400"><FaInstagram /></a>
              <a href="#" className="hover:text-blue-500"><FaLinkedin /></a>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="text-center mt-6 border-t border-gray-700 pt-4 text-sm">
          © {new Date().getFullYear()} UnderDogs. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
