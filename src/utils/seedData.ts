import { Video, UserGoals } from '../types';

export const DEFAULT_GOALS: UserGoals = {
  water: 8,
  steps: 8000,
  sleep: 8,
  kcal: 2000,
};

export const SEED_VIDEOS: Video[] = [
  {
    id: 'seed-vid-1',
    vid: '8mP5XGHAAl8',
    title: '하루의 시작을 여는 아침 스트레칭 요가 (15분)',
    cat: 'yoga',
  },
  {
    id: 'seed-vid-2',
    vid: '2Gg6C_G39g8',
    title: '마음의 평화를 찾는 10분 데일리 마음챙김 명상',
    cat: 'meditation',
  },
  {
    id: 'seed-vid-3',
    vid: 'tLdD8l_3pIQ',
    title: '거북목과 굽은 등 피는 전신 스트레칭 (10분)',
    cat: 'stretch',
  },
  {
    id: 'seed-vid-4',
    vid: 'wS8vEozYFmE',
    title: '스트레스 완화와 깊은 이완을 위한 478 호흡 가이드',
    cat: 'breath',
  },
  {
    id: 'seed-vid-5',
    vid: 'D3S1zU-m3o8',
    title: '불면증 극복! 밤에 하는 숙면 요가와 깊은 이완',
    cat: 'yoga',
  },
  {
    id: 'seed-vid-6',
    vid: 'f3W_1-Wf7Z0',
    title: '지친 마음을 따뜻하게 위로하는 저녁 수면 명상',
    cat: 'meditation',
  },
];

