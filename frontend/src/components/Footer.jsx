import { Facebook, Twitter, Instagram, LinkedIn, Email, Phone, LocationOn } from "@mui/icons-material";

const Footer = () => {
  return (
    <footer className="bg-black text-white py-4">
      <div className="container mx-auto px-4">
        {/* Main Content */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Logo and Mission */}
          <div className="flex items-center space-x-2">
            <img src="/image.png" alt="Logo" className="h-8 w-auto" />
            <p className="text-xs text-gray-300">Connecting hearts, one paw at a time.</p>
          </div>

          {/* Quick Links */}
          <div className="text-center">
            <h3 className="text-xs font-bold mb-2">Quick Links</h3>
            <div className="text-xs space-x-3">
              <a href="#" className="text-gray-400 hover:text-white">Dogs</a>
              <a href="#" className="text-gray-400 hover:text-white">Adopt</a>
              <a href="#" className="text-gray-400 hover:text-white">Volunteer</a>
            </div>
          </div>

          {/* Contact Info */}
          <div className="text-center">
            <h3 className="text-xs font-bold mb-2">Contact</h3>
            <div className="text-xs text-gray-400 flex flex-col items-center">
              <p>
                <LocationOn className="w-3 h-3 inline mr-1" />
                700 University Ave, Monroe LA
              </p>
              <p>
                <Email className="w-3 h-3 inline mr-1" />
                info@p40underdogs.com
              </p>
            </div>
          </div>

          {/* Social Links */}
          <div className="flex justify-center space-x-4 items-center">
            <a href="#" className="text-gray-400 hover:text-white">
              <Facebook className="w-4 h-4" />
            </a>
            <a href="#" className="text-gray-400 hover:text-white">
              <Twitter className="w-4 h-4" />
            </a>
            <a href="#" className="text-gray-400 hover:text-white">
              <Instagram className="w-4 h-4" />
            </a>
            <a href="#" className="text-gray-400 hover:text-white">
              <LinkedIn className="w-4 h-4" />
            </a>
          </div>
        </div>

        {/* Copyright */}
        <div className="text-center mt-4 pt-2 border-t border-gray-700">
          <p className="text-xs text-gray-400">
            &copy; {new Date().getFullYear()} P-40 Underdogs
            <span className="mx-2">|</span>
            <a href="#" className="hover:text-white">Privacy</a>
            <span className="mx-2">|</span>
            <a href="#" className="hover:text-white">Terms</a>
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
