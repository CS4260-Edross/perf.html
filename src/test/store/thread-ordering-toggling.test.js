/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
// @flow
import { storeWithProfile } from '../fixtures/stores';
import * as ProfileViewSelectors from '../../reducers/profile-view';
import * as UrlStateSelectors from '../../reducers/url-state';
import { getProfileWithNamedThreads } from '../fixtures/profiles/make-profile';

import * as ProfileViewActions from '../../actions/profile-view';

describe('thread ordering and toggling', function() {
  // Give names to thread indexes.
  const A = 0;
  const B = 1;
  const C = 2;
  const D = 3;

  function setupHelpers({ dispatch, getState }) {
    return {
      getOrderedThreadNames: () => {
        const state = getState();
        const threads = ProfileViewSelectors.getThreads(state);
        return UrlStateSelectors.getThreadOrder(state).map(
          i => threads[i].name
        );
      },

      getHiddenThreadNames: () => {
        const state = getState();
        const threads = ProfileViewSelectors.getThreads(state);
        return UrlStateSelectors.getHiddenThreads(state).map(
          i => threads[i].name
        );
      },

      getSelectedThreadIndex: () => {
        const state = getState();
        return UrlStateSelectors.getSelectedThreadIndex(state);
      },

      changeThreadOrder: threadOrder => {
        dispatch(ProfileViewActions.changeThreadOrder(threadOrder));
      },

      hideThread: threadIndex => {
        dispatch(ProfileViewActions.hideThread(threadIndex));
      },

      showThread: threadIndex => {
        dispatch(ProfileViewActions.showThread(threadIndex));
      },

      isolateThread: threadIndex => {
        dispatch(ProfileViewActions.isolateThread(threadIndex));
      },
    };
  }

  describe('toggling threads on original sort order', function() {
    const store = storeWithProfile(
      getProfileWithNamedThreads(['A', 'B', 'C', 'D'])
    );
    const {
      getOrderedThreadNames,
      getHiddenThreadNames,
      hideThread,
      showThread,
    } = setupHelpers(store);

    it('starts out with the initial sorting', function() {
      expect(getOrderedThreadNames()).toEqual(['A', 'B', 'C', 'D']);
      expect(getHiddenThreadNames()).toEqual([]);
    });

    it('can hide threads', function() {
      hideThread(C);
      expect(getOrderedThreadNames()).toEqual(['A', 'B', 'C', 'D']);
      expect(getHiddenThreadNames()).toEqual(['C']);

      hideThread(A);
      expect(getOrderedThreadNames()).toEqual(['A', 'B', 'C', 'D']);
      expect(getHiddenThreadNames()).toEqual(['C', 'A']);
    });

    it('can show threads', function() {
      showThread(C);
      expect(getOrderedThreadNames()).toEqual(['A', 'B', 'C', 'D']);
      expect(getHiddenThreadNames()).toEqual(['A']);

      showThread(A);
      expect(getOrderedThreadNames()).toEqual(['A', 'B', 'C', 'D']);
      expect(getHiddenThreadNames()).toEqual([]);
    });
  });

  describe('toggling threads on a sorted thread', function() {
    const store = storeWithProfile(
      getProfileWithNamedThreads(['A', 'B', 'C', 'D'])
    );
    const {
      getOrderedThreadNames,
      getHiddenThreadNames,
      hideThread,
      showThread,
      changeThreadOrder,
    } = setupHelpers(store);

    it('starts out with the initial sorting', function() {
      expect(getOrderedThreadNames()).toEqual(['A', 'B', 'C', 'D']);
      expect(getHiddenThreadNames()).toEqual([]);
    });

    it('is resortable', function() {
      changeThreadOrder([3, 2, 1, 0]);
      expect(getOrderedThreadNames()).toEqual(['D', 'C', 'B', 'A']);
      expect(getHiddenThreadNames()).toEqual([]);
    });

    it('can hide sorted threads', function() {
      hideThread(C);
      hideThread(A);
      expect(getOrderedThreadNames()).toEqual(['D', 'C', 'B', 'A']);
      expect(getHiddenThreadNames()).toEqual(['C', 'A']);
    });

    it('can show sorted threads', function() {
      showThread(C);
      expect(getOrderedThreadNames()).toEqual(['D', 'C', 'B', 'A']);
      expect(getHiddenThreadNames()).toEqual(['A']);

      showThread(A);
      expect(getOrderedThreadNames()).toEqual(['D', 'C', 'B', 'A']);
      expect(getHiddenThreadNames()).toEqual([]);
    });
  });

  describe('hiding the last thread', function() {
    const store = storeWithProfile(
      getProfileWithNamedThreads(['A', 'B', 'C', 'D'])
    );
    const {
      getOrderedThreadNames,
      getHiddenThreadNames,
      hideThread,
    } = setupHelpers(store);

    it('starts out with the initial sorting', function() {
      expect(getOrderedThreadNames()).toEqual(['A', 'B', 'C', 'D']);
      expect(getHiddenThreadNames()).toEqual([]);
    });

    it('cannot hide the last thread', function() {
      hideThread(A);
      hideThread(B);
      hideThread(C);
      hideThread(D);
      expect(getOrderedThreadNames()).toEqual(['A', 'B', 'C', 'D']);
      expect(getHiddenThreadNames()).toEqual(['A', 'B', 'C']);
    });
  });

  describe('hiding a selected thread', function() {
    const store = storeWithProfile(
      getProfileWithNamedThreads(['A', 'B', 'C', 'D'])
    );
    const { hideThread, getSelectedThreadIndex } = setupHelpers(store);

    it('starts out with the initial selected thread', function() {
      expect(getSelectedThreadIndex()).toEqual(A);
    });

    it('will select another thread when hidden', function() {
      hideThread(A);
      expect(getSelectedThreadIndex()).toEqual(B);
    });
  });

  describe('isolate a thread', function() {
    function setup() {
      const store = storeWithProfile(
        getProfileWithNamedThreads(['A', 'B', 'C', 'D'])
      );
      return setupHelpers(store);
    }

    it('starts out with the initial sorting', function() {
      const { getOrderedThreadNames, getHiddenThreadNames } = setup();
      expect(getOrderedThreadNames()).toEqual(['A', 'B', 'C', 'D']);
      expect(getHiddenThreadNames()).toEqual([]);
    });

    it('has the first thread selected', function() {
      const { getSelectedThreadIndex } = setup();
      expect(getSelectedThreadIndex()).toEqual(A);
    });

    it('isolates a thread', function() {
      const {
        getOrderedThreadNames,
        getHiddenThreadNames,
        isolateThread,
      } = setup();
      isolateThread(B);
      expect(getOrderedThreadNames()).toEqual(['A', 'B', 'C', 'D']);
      expect(getHiddenThreadNames()).toEqual(['A', 'C', 'D']);
    });

    it('selects the isolated thread', function() {
      const { getSelectedThreadIndex, isolateThread } = setup();
      isolateThread(B);
      expect(getSelectedThreadIndex()).toEqual(B);
    });
  });
});
