import React, { useEffect, useState } from "react";
import ArticleCard, { Article } from "./ArticleCard";
import SkeletonArticle from "./SkeletonArticle";




const fetchArticles = async (): Promise<Article[]> => {
  const res = await fetch("/src/data/articles.json");
  return res.json();
};


// TODO: Replace with global language state if available
interface ArticleSectionProps {
  language: string;
}

const ArticleSection: React.FC<ArticleSectionProps> = ({ language }) => {
  const [articles, setArticles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    fetchArticles().then((data) => {
      setArticles(data);
      setLoading(false);
    });
  }, []);


  // Map articles to current language fields
  const mappedArticles = articles.map((a) => ({
    ...a,
    title: a.title?.[language] || '',
    summary: a.summary?.[language] || '',
    tags: a.tags?.[language] || [],
  }));

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
    <section className="py-10 px-2 md:px-0 max-w-6xl mx-auto">
      <h2
        className="text-4xl md:text-5xl font-extrabold mb-8 text-center tracking-tight bg-gradient-to-r from-blue-900 via-blue-700 to-slate-900 bg-clip-text text-transparent"
        style={{
          textShadow: '0 2px 16px rgba(37,99,235,0.08)'
        }}
      >
        Articles
      </h2>
      <div className="flex flex-wrap gap-3 mb-8">
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-7">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => <SkeletonArticle key={i} />)
          : filtered.map((article) => (
              <ArticleCard
                key={article.id}
                article={article}
                onTagClick={setSelectedTag}
              />
            ))}
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
