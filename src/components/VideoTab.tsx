import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Play,
  X,
  Plus,
  Trash2,
  Maximize2,
  ExternalLink,
  Video as VideoIcon,
  Search,
  Filter,
  Check
} from 'lucide-react';
import { Video, VideoCategory } from '../types';

interface VideoTabProps {
  videos: Video[];
  onAddVideo: (vid: Omit<Video, 'id'>) => void;
  onRemoveVideo: (id: string) => void;
}

// Robust regex helper to extract YouTube 11-char ID from various link types
export function extractYoutubeId(url: string): string | null {
  const cleanUrl = url.trim();
  if (cleanUrl.length === 11 && /^[a-zA-Z0-9_-]{11}$/.test(cleanUrl)) {
    return cleanUrl;
  }

  // Matches watch?v=, shorts/, live/, embed/, youtu.be/ etc.
  const regexList = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/|youtube\.com\/live\/)([a-zA-Z0-9_-]{11})/,
    /(?:vi?\/|v=)([a-zA-Z0-9_-]{11})/,
  ];

  for (const regex of regexList) {
    const match = cleanUrl.match(regex);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
}

export default function VideoTab({ videos, onAddVideo, onRemoveVideo }: VideoTabProps) {
  const [selectedCat, setSelectedCat] = useState<string>('all');
  const [activePlayerId, setActivePlayerId] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  // --- Add Form State ---
  const [inputUrl, setInputUrl] = useState('');
  const [inputTitle, setInputTitle] = useState('');
  const [inputCat, setInputCat] = useState<VideoCategory>('yoga');
  const [previewId, setPreviewId] = useState<string | null>(null);

  // Fullscreen player container ref
  const playerContainerRef = useRef<HTMLDivElement | null>(null);

  // Category Configuration
  const catConfig = {
    all: { label: '전체' },
    yoga: { label: '요가' },
    meditation: { label: '명상' },
    stretch: { label: '스트레칭' },
    breath: { label: '호흡' },
  };

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputUrl(value);
    const id = extractYoutubeId(value);
    setPreviewId(id);
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const vidId = previewId || extractYoutubeId(inputUrl);
    if (!vidId) {
      alert('올바른 유튜브 링크 혹은 11자리 비디오 ID를 입력해 주세요.');
      return;
    }

    const finalTitle = inputTitle.trim() || `${catConfig[inputCat].label} 영상`;
    onAddVideo({
      vid: vidId,
      title: finalTitle,
      cat: inputCat,
    });

    // Reset fields
    setInputUrl('');
    setInputTitle('');
    setInputCat('yoga');
    setPreviewId(null);
    setShowAddModal(false);
  };

  // Launch browser's native fullscreen API on the player container element
  const handleFullscreenToggle = () => {
    const el = playerContainerRef.current;
    if (!el) return;

    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    } else {
      if (el.requestFullscreen) {
        el.requestFullscreen().catch(() => {});
      } else if ((el as any).webkitRequestFullscreen) {
        (el as any).webkitRequestFullscreen();
      } else if ((el as any).mozRequestFullScreen) {
        (el as any).mozRequestFullScreen();
      }
    }
  };

  // Filter videos based on selection
  const filteredVideos = selectedCat === 'all'
    ? videos
    : videos.filter((v) => v.cat === selectedCat);

  return (
    <div className="space-y-6 pb-24">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <p className="text-[10px] font-bold tracking-widest text-[#A3A3A3] uppercase">MEDITATION & YOGA</p>
          <h1 className="text-2xl font-bold tracking-tight text-black">마음챙김 라이브러리</h1>
          <p className="text-xs text-[#737373] mt-1">오늘 나의 몸과 마음을 이완시켜줄 운동·명상 영상을 실천해 보세요.</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2.5 bg-black hover:bg-[#262626] transition text-white font-bold rounded-lg text-xs flex items-center gap-1.5 shadow-none border border-black"
          id="btn-video-add-modal"
        >
          <Plus className="w-3.5 h-3.5" />
          영상 추가
        </button>
      </div>

      {/* Category Chips Row */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {(Object.keys(catConfig) as (keyof typeof catConfig)[]).map((key) => {
          const cfg = catConfig[key];
          const active = selectedCat === key;
          return (
            <button
              key={key}
              onClick={() => setSelectedCat(key)}
              className={`px-4 py-2.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 border ${
                active
                  ? 'bg-black border-black text-white shadow-none'
                  : 'bg-white border-[#E5E5E5] text-black hover:bg-[#F5F5F5]'
              }`}
              id={`btn-video-filter-${key}`}
            >
              {cfg.label}
            </button>
          );
        })}
      </div>

      {/* Videos Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5" id="video-library-grid">
        {filteredVideos.map((video) => {
          const catCfg = catConfig[video.cat];
          const thumbnailSrc = `https://img.youtube.com/vi/${video.vid}/mqdefault.jpg`;

          return (
            <div
              key={video.id}
              className="bg-white rounded-xl overflow-hidden border border-[#E5E5E5] transition duration-300 flex flex-col group relative"
            >
              {/* Card Thumbnail Area with Play Button overlay */}
              <div
                onClick={() => setActivePlayerId(video.vid)}
                className="relative aspect-video bg-[#F5F5F5] cursor-pointer overflow-hidden flex items-center justify-center"
              >
                <img
                  src={thumbnailSrc}
                  alt={video.title}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                />
                <div className="absolute inset-0 bg-black/15 group-hover:bg-black/25 transition duration-300 flex items-center justify-center">
                  <div className="w-12 h-12 bg-black text-white rounded-full flex items-center justify-center shadow-none transform group-hover:scale-105 transition duration-300 border border-[#E5E5E5]">
                    <Play className="w-5 h-5 fill-current ml-0.5" />
                  </div>
                </div>
              </div>

              {/* Card Meta Content info */}
              <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                <div className="space-y-1.5">
                  <span className="px-2 py-0.5 bg-[#F5F5F5] border border-[#E5E5E5] text-black text-[10px] font-bold rounded uppercase">
                    {catCfg.label}
                  </span>
                  <h3
                    onClick={() => setActivePlayerId(video.vid)}
                    className="font-bold text-sm text-black line-clamp-2 cursor-pointer hover:underline leading-snug"
                  >
                    {video.title}
                  </h3>
                </div>

                <div className="flex justify-between items-center pt-2 border-t border-[#F5F5F5] text-[10px] text-[#737373] font-mono">
                  <span>ID: {video.vid}</span>
                  
                  {/* Delete Button (discreet trash button) */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm('이 영상을 내 라이브러리에서 제거하시겠습니까?')) {
                        onRemoveVideo(video.id);
                      }
                    }}
                    className="p-1 text-gray-300 hover:text-black rounded transition"
                    title="영상 제거"
                    id={`btn-video-delete-${video.id}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {filteredVideos.length === 0 && (
          <div className="col-span-full py-16 text-center space-y-2 bg-[#F5F5F5] rounded-lg border border-dashed border-[#E5E5E5]">
            <VideoIcon className="w-8 h-8 text-black mx-auto" />
            <p className="text-xs text-[#737373] font-bold">이 카테고리에 등록된 영상이 없습니다.</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="text-xs text-black font-extrabold hover:underline"
            >
              새 영상 직접 추가해 보기
            </button>
          </div>
        )}
      </div>

      {/* --- ADD NEW VIDEO OVERLAY MODAL --- */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-end md:items-center justify-center p-0 md:p-4">
            <div className="absolute inset-0" onClick={() => setShowAddModal(false)} />

            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="relative w-full md:max-w-md bg-white rounded-t-2xl md:rounded-2xl shadow-2xl p-6 overflow-hidden z-10 max-h-[85vh] flex flex-col border border-[#E5E5E5]"
            >
              <div className="w-12 h-1 bg-gray-200 rounded-full mx-auto mb-4 md:hidden" />

              <div className="flex justify-between items-center mb-5">
                <h3 className="font-bold text-lg text-black">새 동영상 링크 추가</h3>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="p-1.5 hover:bg-[#F5F5F5] rounded text-gray-400 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form Content */}
              <form onSubmit={handleAddSubmit} className="flex-1 overflow-y-auto space-y-4 pb-6">
                
                {/* 1. Category */}
                <div>
                  <label className="text-xs text-[#737373] font-bold block mb-1.5">카테고리 선택</label>
                  <div className="grid grid-cols-4 gap-2">
                    {(['yoga', 'meditation', 'stretch', 'breath'] as VideoCategory[]).map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setInputCat(cat)}
                        className={`py-2 text-xs font-bold rounded transition border ${
                          inputCat === cat
                            ? 'bg-black text-white border-black'
                            : 'border-[#E5E5E5] hover:bg-[#F5F5F5] text-[#737373]'
                        }`}
                      >
                        {catConfig[cat].label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2. YouTube URL or ID */}
                <div>
                  <label className="text-xs text-[#737373] font-bold block mb-1.5">유튜브 링크 또는 비디오 ID</label>
                  <input
                    type="text"
                    placeholder="https://www.youtube.com/watch?v=..."
                    value={inputUrl}
                    onChange={handleUrlChange}
                    className="w-full px-4 py-2.5 border border-[#E5E5E5] bg-[#F5F5F5] rounded-lg focus:outline-none focus:border-black text-xs font-semibold"
                    id="input-add-video-url"
                  />
                  <span className="text-[10px] text-gray-400 mt-1 block leading-normal">
                    지원이 가능한 주소 양식: 일반 주소, youtu.be, shorts, 라이브, embed 및 11자리 비디오 아이디
                  </span>
                </div>

                {/* Live Preview Area */}
                {previewId && (
                  <div className="p-3 bg-[#F5F5F5] rounded-lg border border-[#E5E5E5] space-y-2">
                    <span className="text-[10px] text-[#737373] font-bold block">가져온 동영상 썸네일 미리보기</span>
                    <div className="aspect-video bg-gray-200 rounded-lg overflow-hidden relative">
                      <img
                        src={`https://img.youtube.com/vi/${previewId}/mqdefault.jpg`}
                        alt="미리보기"
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/10">
                        <div className="w-8 h-8 bg-white/90 rounded-full flex items-center justify-center text-gray-500 text-xs">
                          <Check className="w-4 h-4 text-black font-bold" />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. Title */}
                <div>
                  <label className="text-xs text-[#737373] font-bold block mb-1.5">동영상 제목 (선택)</label>
                  <input
                    type="text"
                    placeholder="미입력 시 기본 영상 제목으로 저장됩니다"
                    value={inputTitle}
                    onChange={(e) => setInputTitle(e.target.value)}
                    className="w-full px-4 py-2.5 border border-[#E5E5E5] bg-[#F5F5F5] rounded-lg focus:outline-none focus:border-black text-xs font-semibold"
                    id="input-add-video-title"
                  />
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={!previewId}
                  className={`w-full py-3.5 text-white font-bold rounded-lg text-sm transition ${
                    previewId
                      ? 'bg-black hover:bg-[#262626]'
                      : 'bg-gray-200 cursor-not-allowed'
                  }`}
                  id="btn-video-add-save"
                >
                  내 보관함에 저장하기
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- IMMERSIVE FULL-SCREEN VIDEO PLAYER OVERLAY --- */}
      <AnimatePresence>
        {activePlayerId && (
          <div className="fixed inset-0 bg-black/95 z-50 flex flex-col justify-between">
            {/* Top Bar inside immersive player */}
            <div className="p-4 bg-gradient-to-b from-black/50 to-transparent flex justify-between items-center text-white z-10">
              <span className="text-xs font-mono font-bold text-gray-400 tracking-wider">Mindful Flow Player</span>
              
              <div className="flex items-center gap-3">
                <button
                  onClick={handleFullscreenToggle}
                  className="p-2 hover:bg-white/10 rounded-lg text-white/80 transition flex items-center gap-1.5 text-xs font-semibold"
                  title="전체화면 전환"
                  id="btn-player-fullscreen"
                >
                  <Maximize2 className="w-4 h-4" />
                  전체화면
                </button>
                <button
                  onClick={() => setActivePlayerId(null)}
                  className="p-2 hover:bg-white/10 rounded-lg text-white transition"
                  title="닫기"
                  id="btn-player-close"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Immersive Responsive iframe Container */}
            <div
              ref={playerContainerRef}
              className="flex-1 w-full flex items-center justify-center p-0 sm:p-6"
            >
              <div className="w-full max-w-5xl aspect-video bg-black shadow-2xl relative">
                <iframe
                  src={`https://www.youtube.com/embed/${activePlayerId}?autoplay=1&rel=0&enablejsapi=1`}
                  title="YouTube Wellness Player"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  className="absolute inset-0 w-full h-full"
                />
              </div>
            </div>

            {/* Empty footer bar just for aesthetic balance */}
            <div className="p-4 bg-gradient-to-t from-black/30 to-transparent text-center text-gray-600 text-[10px] font-medium uppercase tracking-widest pointer-events-none">
              Take a deep breath and relax
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
