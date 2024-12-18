import { useState, useEffect } from 'react';
import { storage } from './storage';

/**
 * ブラウザの機能サポートをチェック
 */
export const checkFeatureSupport = (feature: string): boolean => {
  switch (feature) {
    case 'webp':
      const elem = document.createElement('canvas');
      if (elem.getContext && elem.getContext('2d')) {
        return elem.toDataURL('image/webp').indexOf('data:image/webp') === 0;
      }
      return false;

    case 'localStorage':
      try {
        localStorage.setItem('test', 'test');
        localStorage.removeItem('test');
        return true;
      } catch (e) {
        return false;
      }

    case 'indexedDB':
      return !!window.indexedDB;

    default:
      return false;
  }
};

/**
 * ブラウザ情報を取得
 */
export const getBrowserInfo = () => {
  const ua = navigator.userAgent;
  let browserName = "Unknown";
  let browserVersion = "Unknown";

  if (ua.indexOf("Firefox") > -1) {
    browserName = "Firefox";
    browserVersion = ua.match(/Firefox\/([0-9.]+)/)?.[1] || "";
  } else if (ua.indexOf("Chrome") > -1) {
    browserName = "Chrome";
    browserVersion = ua.match(/Chrome\/([0-9.]+)/)?.[1] || "";
  } else if (ua.indexOf("Safari") > -1) {
    browserName = "Safari";
    browserVersion = ua.match(/Version\/([0-9.]+)/)?.[1] || "";
  } else if (ua.indexOf("Edge") > -1) {
    browserName = "Edge";
    browserVersion = ua.match(/Edge\/([0-9.]+)/)?.[1] || "";
  }

  return {
    name: browserName,
    version: browserVersion,
    isMobile: /Mobile|Android|iPhone/i.test(ua),
    isIOS: /iPhone|iPad|iPod/i.test(ua),
    isAndroid: /Android/i.test(ua),
    isJapanese: /ja|ja-JP/.test(navigator.language),
  };
};

/**
 * ストレージの同期を行うフック
 */
export const useStorageSync = () => {
  useEffect(() => {
    // 初回マウント時にストレージを同期
    storage.sync();

    // ストレージの変更イベントを監視
    const handleStorageSync = (e: CustomEvent) => {
      const { key, value } = e.detail;
      if (key) {
        // Zustand ストアの更新をトリガー
        window.dispatchEvent(new CustomEvent(`zustand-${key}`, {
          detail: { value }
        }));
      }
    };

    window.addEventListener('storageSync', handleStorageSync as EventListener);
    return () => window.removeEventListener('storageSync', handleStorageSync as EventListener);
  }, []);
};

/**
 * IMEの状態を管理するフック
 */
export const useIME = () => {
  const [isIMEOn, setIsIMEOn] = useState(false);

  const handleCompositionStart = () => setIsIMEOn(true);
  const handleCompositionEnd = () => setIsIMEOn(false);

  return {
    isIMEOn,
    handlers: {
      onCompositionStart: handleCompositionStart,
      onCompositionEnd: handleCompositionEnd,
    },
  };
};