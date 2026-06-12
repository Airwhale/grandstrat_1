'use client';

import { useGameStore } from '@/store/gameStore';
import MainMenu from '@/components/screens/MainMenu';
import FactionSelect from '@/components/screens/FactionSelect';
import WorldMap from '@/components/map/WorldMap';
import TopBar from '@/components/ui/TopBar';
import ActionPanel from '@/components/ui/ActionPanel';
import IntelPanel from '@/components/ui/IntelPanel';
import BottomBar from '@/components/ui/BottomBar';
import TacticalGrid from '@/components/combat/TacticalGrid';
import DiplomacyScreen from '@/components/screens/DiplomacyScreen';
import TechTreeScreen from '@/components/screens/TechTreeScreen';
import RosterScreen from '@/components/screens/RosterScreen';
import EventModal from '@/components/screens/EventModal';
import GameOverScreen from '@/components/screens/GameOverScreen';
import MissionBriefing from '@/components/combat/MissionBriefing';
import { AnimatePresence } from 'framer-motion';

export default function GameLayout() {
  const phase = useGameStore((s) => s.phase);
  const currentEvent = useGameStore((s) => s.currentEvent);
  const mission = useGameStore((s) => s.mission);

  return (
    <div className="w-screen h-screen overflow-hidden bg-[#080c14] text-[#e2e8f0] select-none">
      <AnimatePresence mode="wait">
        {phase === 'menu' && <MainMenu key="menu" />}

        {phase === 'faction_select' && <FactionSelect key="faction" />}

        {phase === 'strategic' && (
          <div key="strategic" className="w-full h-full flex flex-col">
            <TopBar />
            <div className="flex-1 flex overflow-hidden">
              <ActionPanel />
              <div className="flex-1 relative">
                <WorldMap />
              </div>
              <IntelPanel />
            </div>
            <BottomBar />
            {currentEvent && <EventModal />}
          </div>
        )}

        {phase === 'tactical' && (
          <div key="tactical" className="w-full h-full">
            {mission && !mission.deployed ? <MissionBriefing /> : <TacticalGrid />}
          </div>
        )}

        {phase === 'diplomacy_screen' && <DiplomacyScreen key="diplomacy" />}
        {phase === 'tech_screen' && <TechTreeScreen key="tech" />}
        {phase === 'roster_screen' && <RosterScreen key="roster" />}

        {phase === 'event' && currentEvent && <EventModal key="event" />}

        {(phase === 'victory' || phase === 'gameover') && (
          <GameOverScreen key="gameover" />
        )}
      </AnimatePresence>
    </div>
  );
}
