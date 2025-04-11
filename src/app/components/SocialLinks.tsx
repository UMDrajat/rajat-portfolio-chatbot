'use client';

import Image from 'next/image';
import { useState } from 'react';

interface SocialLinksProps {
  onNewChat: () => void;
}

const SocialLinks: React.FC<SocialLinksProps> = ({ onNewChat }) => {
  return (
    <div className="flex items-center gap-4">
      <a
        href="https://drive.google.com/file/d/1sHWo-4a9tdcicEv3xIndemcfnoJRq524/view"
        target="_blank"
        rel="noopener noreferrer"
        className="text-sm text-blue-600 hover:underline"
        title="View Resume PDF"
      >
        📄 View Resume
      </a>
      <button
        onClick={onNewChat}
        className="text-sm text-blue-600 hover:underline"
        title="Start a new chat session"
      >
        + New Chat
      </button>
      <a
        href="https://github.com/UMDrajat?tab=overview&from=2025-04-01&to=2025-04-11"
        target="_blank"
        rel="noopener noreferrer"
        title="View GitHub Profile"
      >
        <Image
          src="/github-mark.svg"
          alt="GitHub"
          width={24}
          height={24}
          className="hover:opacity-80 transition"
        />
      </a>
      <a
        href="https://linkedin.com/in/rajatnirwan"
        target="_blank"
        rel="noopener noreferrer"
        title="View LinkedIn Profile"
      >
        <Image
          src="/linkedin.png"
          alt="LinkedIn"
          width={24}
          height={24}
          className="hover:opacity-80 transition"
        />
      </a>
    </div>
  );
};

export default SocialLinks;
