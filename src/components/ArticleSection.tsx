import React, { useEffect, useState } from "react";
import ArticleCard, { Article } from "./ArticleCard";
import SkeletonArticle from "./SkeletonArticle";
import { motion } from "framer-motion";


// Định nghĩa cấu trúc dữ liệu thô từ file JSON
interface RawArticle {
  id: string;
  title: Record<string, string>;
  thumbnail_img: string;
  summary: Record<string, string>;
  link: string;
  tags: Record<string, string[]>;
  author: string;
}

const fetchArticles = async (): Promise<RawArticle[]> => {
  const res = await fetch("/data/articles.json");
  const data = await res.json();
  return data;
};


interface ArticleSectionProps {
  language: string;
  isDarkMode: boolean;
}

const ArticleSection: React.FC<ArticleSectionProps> = ({ language, isDarkMode }) => {
  const [articles, setArticles] = useState<RawArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  const itemVariants = {
    hidden: { opacity: 0, y: 100, scale: 0.8 },
    visible: { 
      opacity: 1, y: 0, scale: 1, 
      transition: { duration: 0.8 } 
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchArticles().then((data) => {
      setArticles(data);
      setLoading(false);
    });
  }, []);


  // Map articles to current language fields
  const mappedArticles: Article[] = articles.map((a) => ({
    ...a,
    title: a.title[language] || a.title['en'] || '',
    summary: a.summary[language] || a.summary['en'] || '',
    tags: a.tags[language] || a.tags['en'] || [],
  })) as Article[];

  // Get unique tags for current language
  const tagSet = new Set<string>();
  mappedArticles.forEach(article => {
    article.tags.forEach((tag: string) => tagSet.add(tag));
  });
  const tagList = Array.from(tagSet);

  const filtered = selectedTag
    ? mappedArticles.filter((a) => a.tags.includes(selectedTag))
    : mappedArticles;

  return (
    <section className="py-24 px-6 md:px-0 max-w-[1400px] mx-auto">
      <h2
        className="text-4xl md:text-5xl font-extrabold mb-8 text-center tracking-tight bg-gradient-to-r from-blue-900 via-blue-700 to-slate-900 bg-clip-text text-transparent"
        style={{
          textShadow: '0 2px 16px rgba(37,99,235,0.08)'
        }}
      >
        Articles
      </h2>
      <div className="flex flex-wrap justify-center gap-3 mb-16">
        <button
          className={`px-4 py-1 rounded-full border text-sm font-semibold transition-colors ${
            !selectedTag
              ? "bg-blue-600 text-white border-blue-600 font-bold"
              : "bg-gray-600 text-white border-gray-600 hover:bg-blue-600 hover:text-white hover:font-bold"
          }`}
          onClick={() => setSelectedTag(null)}
        >
          {language === 'vi' ? 'Tất cả' : language === 'fr' ? 'Tous' : language === 'de' ? 'Alle' : language === 'zh' ? '全部' : 'All'}
        </button>
        {tagList.map((tag) => (
          <button
            key={tag}
            className={`px-4 py-1 rounded-full border text-sm font-semibold transition-colors ${
              selectedTag === tag
                ? "bg-blue-600 text-white border-blue-600 font-bold"
                : "bg-gray-600 text-white border-gray-600 hover:bg-blue-600 hover:text-white hover:font-bold"
            }`}
            onClick={() => setSelectedTag(tag)}
          >
            #{tag}
          </button>
        ))}
        {/* Language switch button removed, now uses global language prop */}
      </div>
      <div 
        className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-16"
      >
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <motion.div 
              key={i} 
              variants={itemVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.1 }}
            ><SkeletonArticle /></motion.div>
          ))
        ) : (
          filtered.map((article) => (
            <motion.div 
              key={article.id} 
              variants={itemVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.1 }}
            >
              <ArticleCard
                article={article}
                onTagClick={setSelectedTag}
              />
            </motion.div>
          ))
        )}
      </div>
      {!loading && filtered.length === 0 && (
        <div className="text-center text-slate-500 dark:text-slate-400 mt-8">
          No articles found for this tag.
        </div>
      )}
    </section>
  );
};

export default ArticleSection;
