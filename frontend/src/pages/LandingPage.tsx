import React, { useState, useEffect } from "react";
import {
  MessageCircle,
  Video,
  Users,
  Trophy,
  BarChart3,
  BookOpen,
  ArrowRight,
  Play,
  Star,
  Target,
} from "lucide-react";
import SignupModal from "../modals/SignupModal";
import LoginModal from "../modals/LoginModal";
import ChangePasswordModal from "../modals/ChangePasswordModal";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/userAuthStore";
import AppIcon from "../assets/app-icon.png";
import SpokelyCard from "../components/common/Cards";
import { logoutService } from "../services/authServices";

const LandingPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const user = useAuthStore();
  const logout = useAuthStore((state) => state.logout);

  const handleLogout = () => {
    logoutService("user");
    logout();
    navigate("/");
  };

  const queryParams = new URLSearchParams(location.search);
  const token = queryParams.get("auth-token");
  const showRoleFlag = queryParams.get("showRole") === "true";

  const [activeModal, setActiveModal] = useState<string | null>(null);

  const openModal = (modalName: string) => setActiveModal(modalName);
  const closeModal = () => setActiveModal(null);

  useEffect(() => {
    if (token) {
      if (showRoleFlag) setActiveModal("role");

      const newURL = window.location.pathname;
      window.history.replaceState({}, document.title, newURL);
    }
  }, [token, showRoleFlag]);

  return (
    <div className="min-h-screen bg-slate-700 text-white">
      {/* HEADER */}
      <header className="bg-slate-800 shadow-sm border-b border-yellow-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4 md:py-2">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <img
                  src={AppIcon}
                  alt="Spokely Logo"
                  className="w-18 h-18 rounded-full object-cover m-0 p-0"
                />
                <span className="text-2xl font-bold text-yellow-400">
                  Spokely
                </span>
              </div>
              <div className="hidden md:block">
                <span className="text-gray-300 text-sm font-medium">
                  Learn communication for speaking
                </span>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              {user.user !== null ? (
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 text-red-300 hover:text-white font-medium transition-colors"
                >
                  Logout
                </button>
              ) : (
                <>
                  <button
                    onClick={() => openModal("login")}
                    className="px-4 py-2 text-gray-300 hover:text-white font-medium transition-colors"
                  >
                    Login
                  </button>
                  <button
                    onClick={() => openModal("signup")}
                    className="px-6 py-2 bg-yellow-500 text-black rounded-lg hover:bg-yellow-400 font-medium transition-colors shadow-sm"
                  >
                    Sign Up
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-yellow-400 mb-6">
            Spokely
          </h1>
          <p className="text-xl md:text-2xl text-gray-200 mb-12 max-w-4xl mx-auto leading-relaxed">
            Transform your communication skills through personalized video
            sessions with expert mentors and passionate peers.
          </p>

          <div className="flex flex-col md:flex-row gap-6 justify-center items-center max-w-4xl mx-auto">
            <SpokelyCard className="flex-1 max-w-md">
              <div className="flex items-center justify-center w-12 h-12 bg-yellow-100 rounded-lg mb-4 mx-auto">
                <BookOpen className="h-6 w-6 text-yellow-600" />
              </div>
              <h3 className="text-xl font-semibold text-black mb-3">
                For Learners
              </h3>
              <p className="text-gray-700 mb-6">
                Connect with expert mentors and join interactive sessions to
                boost your speaking confidence.
              </p>
              <button
                onClick={() => openModal("signup")}
                className="w-full bg-yellow-500 text-black py-3 px-6 rounded-lg hover:bg-yellow-400 font-medium transition-colors flex items-center justify-center space-x-2"
              >
                <span>Start your Journey</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </SpokelyCard>

            <SpokelyCard className="flex-1 max-w-md">
              <div className="flex items-center justify-center w-12 h-12 bg-yellow-100 rounded-lg mb-4 mx-auto">
                <Users className="h-6 w-6 text-yellow-600" />
              </div>
              <h3 className="text-xl font-semibold text-black mb-3">
                For Mentors
              </h3>
              <p className="text-gray-700 mb-6">
                Share your expertise, mentor passionate learners, and make a
                meaningful impact on their journey.
              </p>
              <button
                onClick={() => openModal("signup")}
                className="w-full bg-yellow-500 text-black py-3 px-6 rounded-lg hover:bg-yellow-400 font-medium transition-colors flex items-center justify-center space-x-2"
              >
                <span>Start your Journey</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </SpokelyCard>
          </div>
        </div>
      </section>

      {/* FEATURES SECTION */}
      <section className="py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-yellow-400 mb-4">
              Everything you need to excel
            </h2>
            <p className="text-xl text-gray-200 max-w-2xl mx-auto">
              Comprehensive tools and features designed to accelerate your
              communication journey
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <SpokelyCard>
              <div className="flex items-center justify-center w-14 h-14 bg-yellow-100 rounded-xl mb-6">
                <Video className="h-7 w-7 text-yellow-600" />
              </div>
              <h3 className="text-xl font-semibold text-black mb-4">
                Public & Private Mentor Sessions
              </h3>
              <p className="text-gray-700 leading-relaxed">
                Join live group sessions or book one-on-one mentoring calls with
                industry experts to practice real-world communication scenarios.
              </p>
            </SpokelyCard>

            <SpokelyCard>
              <div className="flex items-center justify-center w-14 h-14 bg-yellow-100 rounded-xl mb-6">
                <Trophy className="h-7 w-7 text-yellow-600" />
              </div>
              <h3 className="text-xl font-semibold text-black mb-4">
                Quizzes & Gamified Learning
              </h3>
              <p className="text-gray-700 leading-relaxed">
                Engage with interactive quizzes, challenges, and gamified
                exercises that make learning communication skills fun and
                memorable.
              </p>
            </SpokelyCard>

            <SpokelyCard>
              <div className="flex items-center justify-center w-14 h-14 bg-yellow-100 rounded-xl mb-6">
                <BarChart3 className="h-7 w-7 text-yellow-600" />
              </div>
              <h3 className="text-xl font-semibold text-black mb-4">
                Track Your Journey with Reports
              </h3>
              <p className="text-gray-700 leading-relaxed">
                Monitor your progress with detailed analytics, performance
                insights, and personalized feedback to continuously improve your
                skills.
              </p>
            </SpokelyCard>
          </div>
        </div>
      </section>

      {/* MENTOR SECTION */}
      <section className="py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-yellow-400 mb-4">
              Empower others as a mentor
            </h2>
            <p className="text-xl text-gray-200 max-w-2xl mx-auto">
              Join our community of expert mentors and make a lasting impact on
              learners worldwide
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <SpokelyCard>
              <div className="flex items-center justify-center w-14 h-14 bg-yellow-100 rounded-xl mb-6">
                <Target className="h-7 w-7 text-yellow-600" />
              </div>
              <h3 className="text-xl font-semibold text-black mb-4">
                Share Your Expertise
              </h3>
              <p className="text-gray-700 mb-6 leading-relaxed">
                Lead impactful sessions, share industry insights, and help
                learners develop confidence in their communication abilities.
              </p>
              <button
                onClick={() => openModal("signup")}
                className="bg-yellow-500 text-black py-2 px-6 rounded-lg hover:bg-yellow-400 font-medium transition-colors inline-flex items-center space-x-2"
              >
                <span>Start Mentoring</span>
                <Play className="h-4 w-4" />
              </button>
            </SpokelyCard>

            <SpokelyCard>
              <div className="flex items-center justify-center w-14 h-14 bg-yellow-100 rounded-xl mb-6">
                <Star className="h-7 w-7 text-yellow-600" />
              </div>
              <h3 className="text-xl font-semibold text-black mb-4">
                Build Your Reputation
              </h3>
              <p className="text-gray-700 mb-6 leading-relaxed">
                Grow your professional network, earn recognition for your
                mentoring skills, and establish yourself as a thought leader.
              </p>
              <button
                onClick={() => openModal("signup")}
                className="bg-yellow-500 text-black py-2 px-6 rounded-lg hover:bg-yellow-400 font-medium transition-colors inline-flex items-center space-x-2"
              >
                <span>Join Community</span>
                <Users className="h-4 w-4" />
              </button>
            </SpokelyCard>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-slate-900 text-gray-300 py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="md:col-span-2">
              <div className="flex items-center space-x-2 mb-4">
                <MessageCircle className="h-8 w-8 text-yellow-400" />
                <span className="text-2xl font-bold text-yellow-400">
                  Spokely
                </span>
              </div>
              <p className="text-gray-400 mb-6 max-w-md leading-relaxed">
                Spokely is a revolutionary communication training platform that
                connects learners with expert mentors to transform speaking
                skills through personalized video sessions and interactive
                learning experiences.
              </p>
            </div>

            <div>
              <h4 className="text-lg font-semibold mb-4 text-yellow-400">
                Platform
              </h4>
              <ul className="space-y-2 text-gray-400">
                <li>For Learners</li>
                <li>For Mentors</li>
                <li>Group Sessions</li>
                <li>Private Coaching</li>
              </ul>
            </div>

            <div>
              <h4 className="text-lg font-semibold mb-4 text-yellow-400">
                Support
              </h4>
              <ul className="space-y-2 text-gray-400">
                <li>Help Center</li>
                <li>Contact Us</li>
                <li>Community</li>
                <li>Resources</li>
              </ul>
            </div>
          </div>

          <div className="border-t border-slate-700 mt-12 pt-8 text-center text-gray-500">
            <p>©2025 Spokely. Built with passion for better communication.</p>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <SignupModal
        isOpen={activeModal === "signup"}
        onClose={closeModal}
        onSwitchToLogin={() => openModal("login")}
      />

      <LoginModal
        isOpen={activeModal === "login"}
        onClose={closeModal}
        onSwitchToSignup={() => openModal("signup")}
        onForgotPassword={() => openModal("password")}
      />

      <ChangePasswordModal
        isOpen={activeModal === "password"}
        onClose={closeModal}
        onChangePassword={() => {
          closeModal();
        }}
      />
    </div>
  );
};

export default LandingPage;
