import { GetStaticProps } from 'next';
import { getPrismicClient } from '../services/prismic';
import { FiCalendar, FiUser } from "react-icons/fi";

import commonStyles from '../styles/common.module.scss';
import Prismic from '@prismicio/client';
import Head from 'next/head';
import styles from './home.module.scss';
import Link from 'next/link';
import { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

let offset = 1;

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
}

export default function Home({ results, next_page }: PostPagination) {

  const formatedPosts = results.map(post => {
    return {
      ...post,
      first_publication_date: format(
        new Date(post.first_publication_date),
        'dd MMM yyyy',
        {
          locale: ptBR,
        }
      )
    }
  });

  const [posts, setPosts] = useState<Post[]>(formatedPosts);
  const [nextPage, setNextPage] = useState(next_page);
  const [offset, setOffset] = useState(1);

  async function handleNextPage(): Promise<void> {
    if (offset !== 1 && nextPage === null) return;

    const newPosts = await fetch(`${nextPage}`)
      .then(res => res.json());

    setNextPage(newPosts.next_page);
    setOffset(newPosts.page);

    const newPost = newPosts.results.map(post => {
      return {
        uid: post.uid,
        first_publication_date: format(
          new Date(post.first_publication_date),
          'dd MMM yyyy',
          {
            locale: ptBR,
          }
        ),
        data: {
          title: post.data.title,
          subtitle: post.data.subtitle,
          author: post.data.author,
        },
      }
    });

    setPosts([...posts, ...newPost]);

  }

  return (
    <>
      <Head>
        <title>Home | Spacetraveling</title>
      </Head>

      <div className={styles.container}>
        <div className={styles.wrap}>
          <img src="./assets/logo.svg" />

          <div className={styles.post}>
            {
              posts.map(post => (
                <Link href={`/posts/${post.uid}`}>
                  <a key={post.uid}>
                    <strong>{post.data.title}</strong>
                    <p>{post.data.subtitle}</p>
                    <div className={styles.details}>
                      <p><FiCalendar size="20px" />{post.first_publication_date}</p>
                      <p><FiUser size="20px" />{post.data.author}</p>
                    </div>
                  </a>
                </Link>
              ))
            }

          </div>

         <a className={nextPage !== null ? styles.loadMore : styles.hidden} onClick={async () => await handleNextPage()} href="#">Carregar mais posts</a>
          

        </div>
      </div>
    </>
  );
}

export const getStaticProps: GetStaticProps = async () => {

  const prismic = getPrismicClient();

  const response = await prismic.query([
    Prismic.predicates.at('document.type', 'posts')
  ], {
    fetch: ['publication.title', 'publication.content'],
    pageSize: offset,
  })

  const posts = response.results.map(post => {
    return {
      uid: post.uid,
      first_publication_date: post.last_publication_date,
      data: {
        title: post.data.title,
        subtitle: post.data.subtitle,
        author: post.data.author,
      },

    }
  });

  return {
    props: {
      next_page: response.next_page,
      results: posts
    }
  }
}
