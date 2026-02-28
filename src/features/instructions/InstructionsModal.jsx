import { Modal } from '../../components/Modal';

export function InstructionsModal({ isOpen, onClose }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Captain's Briefing">
      <div className="instructions-content">
        <section className="instructions-section">
          <h3>Your Goal</h3>
          <p>
            You've spent years hauling cargo through the wormhole lanes of Sol
            Sector. Bad deals, rough encounters, and the relentless cost of
            keeping a ship running have taken their toll. You're tired. All you
            want is enough credits to retire somewhere quiet and never look at a
            cargo manifest again.
          </p>
          <p>
            Save up enough and you might just make it. But space doesn't make it
            easy — fuel costs money, hulls don't repair themselves, and not
            everyone out there has your best interests at heart. Stay sharp,
            trade smart, and survive long enough to earn your way out.
          </p>
        </section>

        <section className="instructions-section">
          <h3>Navigation</h3>
          <p>
            The starmap shows 117 real star systems connected by wormhole lanes.
            To travel, click the <strong>System Info</strong> button in the Quick
            Access panel to view a system's details, wormhole connections, and
            the option to jump there. Every jump costs fuel and advances time.
          </p>
        </section>

        <section className="instructions-section">
          <h3>Stations</h3>
          <p>
            When you're in a system with a station, click the{' '}
            <strong>Dock</strong> button in the Quick Access panel to go aboard.
            From there you can trade goods, refuel, and repair your ship. Each
            system has different prices — buy low, sell high. Keep an eye on your
            credits and cargo hold.
          </p>
        </section>

        <section className="instructions-section">
          <h3>The Science</h3>
          <p>
            The stars in this game are real systems within 20 light-years of Sol.
            Their colors and relative sizes are as accurate as we could make
            them, with a minimum size so the smallest remain visible. Most are
            red dwarfs — too dim to see with the naked eye. Until modern
            astronomy, we didn't even know they existed.
          </p>
          <p>
            The antimatter view in the settings menu simply inverts the colors.
            In reality, an antimatter universe would probably look much the same
            as ours — light is its own antiparticle, after all. The difference
            is that if you were actually there, every atom of your body would
            annihilate on contact. So enjoy the view from this side.
          </p>
        </section>
      </div>
    </Modal>
  );
}
