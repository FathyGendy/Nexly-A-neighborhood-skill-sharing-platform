import { ArrowLeft, Heart, Users, Globe, Mail, Briefcase } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function CareersPage() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
             <nav className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-100 dark:border-gray-700 px-6 py-4 sticky top-0 z-10">
                <div className="max-w-6xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition">
                            <ArrowLeft size={20} className="text-gray-600 dark:text-gray-300" />
                        </button>
                        <h1 className="text-xl font-bold text-gray-800 dark:text-white">Nexly Careers</h1>
                    </div>
                </div>
            </nav>

            <main className="max-w-5xl mx-auto px-6 py-12">
                <div className="text-center mb-16">
                    <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white mt-3 mb-6">Build the Future of Community</h2>
                    <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto leading-relaxed">
                        Nexly is on a mission to bring neighborhoods back to life. We are currently building our core team and preparing for launch.
                    </p>
                </div>

                {/* Company Values Section */}
                <div className="grid md:grid-cols-3 gap-6 mb-16">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-100 dark:border-gray-700">
                        <div className="text-red-500 mb-4"><Heart size={32} /></div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Impact Driven</h3>
                        <p className="text-gray-600 dark:text-gray-400 text-sm">
                            We don't just write code; we build tools that help real people solve real problems in their daily lives.
                        </p>
                    </div>
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-100 dark:border-gray-700">
                        <div className="text-blue-500 mb-4"><Users size={32} /></div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Community First</h3>
                        <p className="text-gray-600 dark:text-gray-400 text-sm">
                            Our team is diverse, inclusive, and behaves like a good neighbor. We trust and support each other.
                        </p>
                    </div>
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-100 dark:border-gray-700">
                        <div className="text-green-500 mb-4"><Globe size={32} /></div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Remote Culture</h3>
                        <p className="text-gray-600 dark:text-gray-400 text-sm">
                            We believe talent is everywhere. We are building a remote-first culture that values output over hours.
                        </p>
                    </div>
                </div>

                {/* Recruitment Section */}
                <div className="max-w-3xl mx-auto mt-12 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden relative">
                    {/* Decorative Top Bar */}
                    <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500"></div>
                    
                    <div className="p-10 text-center">
                        <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Briefcase size={32} />
                        </div>
                        
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Join our Talent Network</h3>
                        <p className="text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
                            While we don't have open positions at this exact moment, we are growing fast. 
                            If you are a developer, designer, or community manager who loves our mission, 
                            we'd still love to hear from you for future opportunities.
                        </p>

                        <div className="inline-block w-full max-w-lg">
                            <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-200 dark:border-gray-600 p-4 flex flex-col md:flex-row items-center justify-between gap-4">
                                <div className="flex items-center gap-3">
                                    <Mail className="text-gray-400" size={20} />
                                    <span className="font-medium text-gray-700 dark:text-gray-200">Send your resume to:</span>
                                </div>
                                <a 
                                    href="mailto:nexlyrecruitment@gmail.com" 
                                    className="px-4 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg font-bold text-sm hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors break-all"
                                >
                                    nexlyrecruitment@gmail.com
                                </a>
                            </div>
                            <p className="text-xs text-gray-400 mt-3">
                                We review every email and keep standout resumes on file.
                            </p>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}