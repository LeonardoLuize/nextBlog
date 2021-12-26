import styles from './header.module.scss';
import Link from 'next/link';

export default function Header() {
  return (
    <div className={styles.container}>
      <section>
        <Link href="/">
          <a>
            <img alt="logo" src="../assets/logo.svg" />
          </a>
        </Link>
      </section>
    </div>
  );
}
