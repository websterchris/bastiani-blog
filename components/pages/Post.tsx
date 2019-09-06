import Disqus from 'disqus-react';
import marked from 'marked';
import { NextSeo } from 'next-seo';
import Highlight from 'react-highlight';
import { fetchQuery, QueryRenderer } from 'react-relay';

import {
  createEnvironment,
  initEnvironment
} from '../../lib/createEnvironment';
import '../../static/css/vs2015.css';
import { PostQueryResponse } from './queries/__generated__/PostQuery.graphql';
import { postQuery } from './queries/PostQuery';

interface IProps {
  postBySlug: PostQueryResponse['postBySlug'];
  relayData: string;
  variables: object;
}

const renderPostText = (text: string) => {
  marked.setOptions({
    gfm: true,
    tables: true,
    breaks: true
  });
  const postArray = text.split('/$');
  return postArray.map((post, index) => {
    if (post.includes('code')) {
      return (
        // @ts-ignore
        <Highlight key={index} language='javascript' innerHtml>
          {post.replace('code', '')}
        </Highlight>
      );
    }
    return (
      <div key={index} dangerouslySetInnerHTML={{ __html: marked(post) }} />
    );
  });
};

const PostDetails = ({ postBySlug }: any) => (
  <>
    {postBySlug && (
      <>
        <h1>{postBySlug.title}</h1>
        <h2>{postBySlug.description}</h2>
        <p>{renderPostText(postBySlug.text)}</p>
      </>
    )}
  </>
);

const Post = (props: IProps) => {
  const { relayData, variables } = props;
  const environment = createEnvironment(
    relayData,
    JSON.stringify({
      // @ts-ignore
      queryID: undefined,
      variables
    })
  );
  return process.browser ? (
    <QueryRenderer
      environment={environment}
      // @ts-ignore
      query={postQuery}
      variables={variables}
      render={({ error, props: queryProps }: any) => {
        if (error) {
          console.log(error.message);
          return;
        }
        // @ts-ignore
        else if (queryProps) {
          const { postBySlug } = queryProps;
          const disqusShortname = 'rafaelbastiani-com';
          const disqusConfig = {
            url: window.location.href,
            identifier: postBySlug.id,
            title: postBySlug.title
          };

          return (
            <>
              <NextSeo
                title={postBySlug.title}
                description={postBySlug.description}
                canonical='https://www.canonical.ie/'
                openGraph={{
                  url: window.location.href,
                  title: 'Open Graph Title',
                  description: 'Open Graph Description',
                  images: [
                    {
                      url: postBySlug.image,
                      width: 800,
                      height: 600,
                      alt: 'Og Image Alt'
                    },
                    {
                      url: postBySlug.image,
                      width: 900,
                      height: 800,
                      alt: 'Og Image Alt Second'
                    },
                    { url: postBySlug.image }
                  ],
                  site_name: 'Rafael Campos de Bastiani'
                }}
                twitter={{
                  handle: '@handle',
                  site: '@site',
                  cardType: 'summary_large_image'
                }}
              />
              <PostDetails postBySlug={postBySlug} />
              <Disqus.DiscussionEmbed
                shortname={disqusShortname}
                config={disqusConfig}
              />
            </>
          );
        }
        return <div>Loading</div>;
      }}
    />
  ) : null;
};

Post.getInitialProps = async ({ query: queryParams }: any) => {
  const variables = { slug: queryParams.slug };
  if (initEnvironment && postQuery) {
    const { environment, relaySSR } = initEnvironment();

    await fetchQuery(environment, postQuery, variables);
    const relayData = await relaySSR.getCache();

    return {
      variables,
      relayData
    };
  }
  return {
    variables
  };
};

export default Post;
