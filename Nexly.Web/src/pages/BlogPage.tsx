import { ArrowLeft, BookOpen, Shield, Sparkles, Mail, PenTool } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function BlogPage() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
            <nav className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-100 dark:border-gray-700 px-6 py-4 sticky top-0 z-10">
                <div className="max-w-6xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition">
                            <ArrowLeft size={20} className="text-gray-600 dark:text-gray-300" />
                        </button>
                        <h1 className="text-xl font-bold text-gray-800 dark:text-white">Nexly Blog</h1>
                    </div>
                </div>
            </nav>

            <main className="max-w-4xl mx-auto px-6 py-16">
                <div className="text-center mb-16">
                    <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-4 py-1.5 rounded-full text-sm font-semibold tracking-wide uppercase">
                        Coming Soon
                    </span>
                    <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white mt-6 mb-6">The Neighborhood Voice</h2>
                    <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto leading-relaxed">
                        We are currently preparing a space dedicated to sharing the stories that make our communities special. The Nexly Blog will be your source for updates, tips, and inspiration.
                    </p>
                </div>

                {/* Content Pillars */}
                <div className="grid md:grid-cols-3 gap-8 mb-8">
                    <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 text-center hover:-translate-y-1 transition-transform duration-300">
                        <div className="w-14 h-14 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded-full flex items-center justify-center mx-auto mb-6">
                            <BookOpen size={28} />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Community Stories</h3>
                        <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                            Real stories from neighbors helping neighbors. We'll spotlight the heroes making a difference in your local area.
                        </p>
                    </div>

                    <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 text-center hover:-translate-y-1 transition-transform duration-300">
                        <div className="w-14 h-14 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Shield size={28} />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Safety & Trust</h3>
                        <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                            Guides on how to verify services, stay safe online, and build a secure environment for your family and neighbors.
                        </p>
                    </div>

                    <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 text-center hover:-translate-y-1 transition-transform duration-300">
                        <div className="w-14 h-14 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Sparkles size={28} />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Platform Updates</h3>
                        <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                            Be the first to know about new features, app improvements, and our roadmap for connecting the world locally.
                        </p>
                    </div>
                </div>

                {/* Submission Section */}
                <div className="mt-16 bg-gradient-to-br from-indigo-50 to-white dark:from-gray-800 dark:to-gray-800/50 rounded-2xl p-8 md:p-10 border border-indigo-100 dark:border-gray-700 flex flex-col md:flex-row items-center justify-between gap-8 shadow-sm">
                    <div className="flex-1 text-center md:text-left">
                        <div className="inline-flex p-3 bg-white dark:bg-gray-700 rounded-xl shadow-sm mb-4 text-indigo-600 dark:text-indigo-400">
                            <PenTool size={24} />
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Have a story to share?</h3>
                        <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                            We are looking for guest writers and community spotlights for our launch. If you have a neighborhood story, we want to read it.
                        </p>
                    </div>
                    
                    <div className="flex-shrink-0 w-full md:w-auto">
                        <div className="bg-white dark:bg-gray-900 p-1.5 rounded-xl border border-gray-200 dark:border-gray-600 shadow-sm">
                            <a 
                                href="mailto:nexlyeditorialteam@gmail.com" 
                                className="flex items-center gap-3 px-6 py-4 bg-indigo-50 hover:bg-indigo-100 dark:bg-gray-800 dark:hover:bg-gray-700 rounded-lg transition-colors group"
                            >
                                <div className="bg-indigo-600 text-white p-2 rounded-full">
                                    <Mail size={18} />
                                </div>
                                <div className="text-left">
                                    <p className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold uppercase tracking-wider">Email the Editors</p>
                                    <p className="text-sm font-bold text-gray-900 dark:text-white break-all">nexlyeditorialteam@gmail.com</p>
                                </div>
                            </a>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}