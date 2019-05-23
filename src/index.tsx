import ApolloClient, { ApolloQueryResult, QueryOptions } from 'apollo-client';
import { DocumentNode } from 'graphql';
import hoistNonReactStatics from 'hoist-non-react-statics';
import * as PropTypes from 'prop-types';
import * as React from "react";
import { getClient } from "react-apollo/component-utils";

export function withLazyQuery<TProps extends TGraphQLVariables | {} = {},
  TData = {},
  TGraphQLVariables = {},
  TChildProps extends {
    fetch: (options?: QueryOptions<TGraphQLVariables>) => Promise<ApolloQueryResult<TData>>;
  } | {} = {}>(
  document: DocumentNode,
  operationOptions: { name?: string; options?: QueryOptions<TGraphQLVariables> } = {} = {},
) {
  return (
    WrappedComponent: React.ComponentType<TProps & TChildProps>,
  ): React.ComponentType<TProps> => {
    class GraphQL extends React.Component<TProps> {
      static WrappedComponent = WrappedComponent;

      static contextTypes = {
        client: PropTypes.object,
      };

      private client: ApolloClient<any>;

      constructor(props, context) {
        super(props, context);

        this.client = getClient(props, context);
      }

      fetch = (options?: QueryOptions<TGraphQLVariables>): Promise<ApolloQueryResult<TData>> => {
        const queryOptions = operationOptions.options || {};
        return (this.client as ApolloClient<any>).query({
          query: document,
          ...queryOptions,
          ...options,
        });
      }

      render() {
        const { name = 'fetch' } = operationOptions;
        return (
          <WrappedComponent
            {...this.props as TProps}
            {...{ [name]: this.fetch } as TChildProps}
          />
        );
      }
    }

    // Make sure we preserve any custom statics on the original component.
    return hoistNonReactStatics<TProps, any>(GraphQL, WrappedComponent, {});
  };
}