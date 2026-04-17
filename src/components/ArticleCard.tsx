import React from "react";
import { motion } from "motion/react";

export interface Article {
  id: string;
  title: string;
  thumbnail_img: string;
  summary: string;
  link: string;
  tags: string[];
  author: string;
}

interface ArticleCardProps {
  article: Article;
  onTagClick?: (tag: string) => void;
}

const ArticleCard: React.FC<ArticleCardProps> = ({ article, onTagClick }) => {
  return (
    <motion.a
      href={article.link}
      target="_blank"
      rel="noopener noreferrer"
      className="group block bg-white dark:bg-slate-900 rounded-2xl shadow-md overflow-hidden transition-all duration-300 hover:shadow-xl border border-slate-100 dark:border-slate-800"
      whileHover={{ y: -8, boxShadow: "0 12px 32px rgba(0,0,0,0.10)" }}
    >
      <div className="relative overflow-hidden h-80 md:h-[450px]">
        <motion.img
          src={article.thumbnail_img}
          alt={article.title}
          className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-105"
          whileHover={{ scale: 1.08 }}
        />
      </div>
      <div className="p-8 flex flex-col gap-4">
        <h3 className="font-extrabold text-2xl md:text-3xl text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors line-clamp-2 leading-tight">
          {article.title}
        </h3>
        <div className="flex flex-wrap gap-2 mb-1">
          {article.tags.map((tag) => (
            <button
              key={tag}
              onClick={e => { e.preventDefault(); onTagClick && onTagClick(tag); }}
              className="px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900 text-xs font-semibold text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
            >
              #{tag}
            </button>
          ))}
        </div>
        <p className="text-slate-600 dark:text-slate-300 text-base md:text-lg line-clamp-3 mb-2 group-hover:line-clamp-none transition-all">
          {article.summary}
        </p>
        <div className="flex items-center justify-between mt-auto">
          <span className="text-sm text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">{article.author}</span>
        </div>
      </div>
    </motion.a>
  );
};

export default ArticleCard;
