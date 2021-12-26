import { GetStaticPaths, GetStaticProps } from 'next';
import Head from 'next/head';
import Header from '../../components/Header';
import { FiCalendar, FiUser, FiClock } from "react-icons/fi";
import Prismic from '@prismicio/client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { RichText } from 'prismic-dom';

import { getPrismicClient } from '../../services/prismic';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';
import { useRouter } from 'next/router';

interface Post {
  first_publication_date: string | null;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
}

export default function Post({ post }): JSX.Element {

  const totalWords = post.data.content.reduce((total, contentItem) => {
    total += contentItem.heading.split(' ').length

    const words = contentItem.body.map(item => item.text.split(' ').length);

    words.map(word => (total += word));

    return total;
  }, 0);

  const averageTime = Math.ceil(totalWords / 200);

  const router = useRouter();

  if(router.isFallback){
    return <h1>Carregando...</h1>;
  }

  const formatedData = format(
    new Date(post.first_publication_date),
    'dd MMM yyyy',
    {
      locale: ptBR,
    }
  )

  return (
    <>
      <Head>
        <title>{post.data.title} | Spacetraveling</title>
      </Head>
      <Header />

      <div className={styles.banner}>
        <img src={post.data.banner.url} />
      </div>

      <div className={styles.container}>
        <div className={styles.titleWrap}>
          <strong>{post.data.title}</strong>
          <section>
            <span><FiCalendar size="20px" /> {formatedData}</span>
            <span><FiUser size="20px" /> {post.data.author}</span>
            <span><FiClock size="20px" /> {averageTime} min</span>
          </section>
        </div>
        <div className={styles.content}>
          {
            post.data.content.map(section => (
              <article key={section.heading}>
                <strong>{section.heading}</strong>
                <div dangerouslySetInnerHTML={{ __html: RichText.asHtml(section.body) }} />
              </article>
            ))
          }
        </div>


      </div>
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();
  const post = await prismic.query([
    Prismic.Predicates.at('document.type', 'posts')
  ])

  const paths = post.results.map(post => {
    return {
      params: {
        slug: post.uid
      }
    }
  })

  return {
    paths,
    fallback: true
  }
}

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const { slug } = params;
  const prismic = getPrismicClient();

  const post = await prismic.getByUID('posts', String(slug), {});

  const posts = {
    first_publication_date: post.first_publication_date,
    data: {
      title: post.data.title,
      banner: {
        url: post.data.banner.url,
      },
      author: post.data.author,
      content: [],
    }
  }

  for (let i = 0; i < post.data.content.length; i++) {
    let content = post.data.content[i];

    posts.data.content.push(content);
  }

  return {
    props: {
      post: posts,
      revalidate: 60 * 30
    }
  }
}