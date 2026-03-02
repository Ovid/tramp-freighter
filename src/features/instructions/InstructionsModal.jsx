import { Modal } from '../../components/Modal';

export function InstructionsModal({ isOpen, onClose }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Captain's Briefing">
      <div className="instructions-content">
        <section className="instructions-section">
          <h3>Your Goal</h3>
          <p>
            You owe Marcus Cole ten thousand credits — and he's not the patient
            type. Check the <strong>Finance</strong> menu at any station to see
            your debt terms: interest, withholding, and payment options.
          </p>
          <p>
            Trade smart, pay down the debt, and build a reputation. The traders
            who last longest out here aren't just rich — they know the right
            people. There are rumors of routes beyond the known lanes, but
            nobody's going to share those with a stranger. Earn your way in.
          </p>
        </section>

        <section className="instructions-section">
          <h3>Navigation</h3>
          <p>
            The starmap shows 117 real star systems connected by wormhole lanes.
            To travel, click the <strong>System Info</strong> button in the
            Quick Access panel to view a system's details, wormhole connections,
            and the option to jump there. Every jump costs fuel and advances
            time.
          </p>
        </section>

        <section className="instructions-section">
          <h3>Stations</h3>
          <p>
            When you're in a system with a station, click the{' '}
            <strong>Dock</strong> button in the Quick Access panel to go aboard.
            From there you can trade goods, refuel, and repair your ship. Each
            system has different prices — buy low, sell high.
          </p>
          <p>
            The <strong>Info Broker</strong> sells market intelligence — rumors
            and price data for nearby systems. Worth the credits if you want to
            trade smart instead of flying blind.
          </p>
          <p>
            The <strong>Mission Board</strong> posts cargo runs and passenger
            contracts. Missions pay on delivery and don't cost anything upfront
            — good supplemental income alongside trading.
          </p>
          <p>
            Talk to <strong>People</strong> at stations. Build relationships and
            they'll share tips, offer favors, and open doors you didn't know
            existed.
          </p>
        </section>

        <section className="instructions-section">
          <h3>The Science</h3>
          <p>
            The stars in this game are real systems within 20 light-years of
            Sol. Their colors and relative sizes are as accurate as we could
            make them, with a minimum size so the smallest remain visible. Most
            are red dwarfs — too dim to see with the naked eye. Until modern
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
