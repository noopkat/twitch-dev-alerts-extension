"use strict";

(function () {
  const _window$preact = window.preact,
        h = _window$preact.h,
        render = _window$preact.render,
        Component = _window$preact.Component;
  const twitch = window.Twitch.ext;
  const assetsDir = 'assets';
  const imagesDir = 'images';
  const eventListSize = 3;
  const animateTimeout = 1000;
  const githubEventNames = {
    pull_request: 'pull_request',
    issue: 'issues',
    check_suite: 'check_suite'
  };
  const githubEventIcons = {
    pull_request: 'git-pull-request.svg',
    issue: 'alert-circle.svg',
    check_pass: 'check-circle.svg',
    check_fail: 'x-circle.svg'
  };
  /* 
   HELPER FUNCTIONS
  */

  function getEventIcon(event) {
    let icon;

    switch (event.event_name) {
      case githubEventNames.check_suite:
        icon = event.conclusion === 'success' ? githubEventIcons.check_pass : githubEventIcons.check_fail;
        break;

      case githubEventNames.pull_request:
        icon = githubEventIcons.pull_request;
        break;

      case githubEventNames.issue:
        icon = githubEventIcons.issue;
        break;

      default:
        icon = githubEventIcons.pull_request;
    }

    return icon;
  }

  function createEventSentence(event) {
    let eventSentence = '';

    switch (event.event_name) {
      case githubEventNames.check_suite:
        const conclusion = event.conclusion === 'success' ? 'passed' : 'failed';
        const object = event.number ? `pull request #${event.number}` : `branch ${event.head_branch}`;
        eventSentence = `Checks ${conclusion} for ${object} on ${event.repository}`;
        break;

      case githubEventNames.pull_request:
        const action = event.merged ? 'merged' : event.action;
        eventSentence = `${event.sender} ${action} pull request #${event.number} on ${event.repository}`;
        break;

      case githubEventNames.issue:
        eventSentence = `${event.sender} ${event.action} issue #${event.number} on ${event.repository}`;
        break;
    }

    return eventSentence;
  }
  /* 
   PREACT APP 
  */


  const Placeholder = () => preact.h("li", null, preact.h("img", {
    src: `${assetsDir}/${imagesDir}/coffee.svg`,
    height: "15"
  }), "No activity yet!");

  const GithubEvent = props => {
    const event = props.event,
          html_url = props.event.html_url,
          flash = props.flash;
    const eventIconSrc = `${assetsDir}/images/${getEventIcon(event)}`;
    const eventSentence = createEventSentence(event);
    const listItemClass = flash ? 'animate' : '';
    return preact.h("li", {
      class: listItemClass
    }, preact.h("img", {
      src: eventIconSrc,
      height: "15"
    }), preact.h("a", {
      target: "_blank",
      href: html_url
    }, eventSentence));
  };

  class GithubEventList extends Component {
    constructor() {
      super();
      this.state.latestEvents = [];
    }

    twitchListenHandler(target, contentType, data) {
      const event_json = JSON.parse(data);
      const newEvents = [event_json].concat(this.state.latestEvents);
      if (newEvents.length > eventListSize) newEvents.pop();
      this.setState({
        latestEvents: newEvents,
        flash: true
      });
      setTimeout(() => this.setState({
        flash: false
      }), animateTimeout);
    }

    componentDidMount() {
      twitch.listen('broadcast', this.twitchListenHandler.bind(this));
    }

    render(props, state) {
      const latestEvents = state.latestEvents,
            flash = state.flash;
      const shouldFlash = index === 0 ? flash : false;
      const list = latestEvents.map((event, index) => preact.h(GithubEvent, {
        flash: shouldFlash,
        event: event
      }));
      return preact.h("ul", {
        class: props.visible ? '' : 'hide'
      }, list.length ? list : preact.h(Placeholder, null));
    }

  }

  ;

  class App extends Component {
    constructor() {
      super();
      this.state.visible = true;
    }

    toggleVisibility() {
      const visible = this.state.visible ? false : true;
      this.setState({
        visible
      });
    }

    render(props, state) {
      const hideButtonTitle = state.visible ? 'hide' : 'show';
      const hideButtonSVG = state.visible ? 'eye-off' : 'eye';
      const hideButtonImageSrc = `${assetsDir}/images/${hideButtonSVG}.svg`;
      return preact.h("div", null, preact.h("div", {
        id: "header"
      }, preact.h("span", null, "Code Activity"), preact.h("button", {
        id: "hideButton",
        onClick: () => this.toggleVisibility(),
        title: hideButtonTitle
      }, preact.h("img", {
        src: hideButtonImageSrc,
        height: "13"
      }))), preact.h(GithubEventList, {
        visible: state.visible
      }));
    }

  }
  /*
    FINAL RENDER
  */


  render(preact.h(App, null), document.querySelector('#app'));
})();