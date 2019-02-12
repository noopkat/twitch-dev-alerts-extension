"use strict";

const _window$preact = window.preact,
      h = _window$preact.h,
      render = _window$preact.render,
      Component = _window$preact.Component;
const twitch = window.Twitch.ext;
const eventListSize = 3;
const assetsDir = 'assets';
const githubEventNames = {
  pull_request: 'PullRequestEvent',
  issue: 'IssuesEvent',
  check_suite: 'CheckSuiteEvent'
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
  src: `${assetsDir}/images/coffee.svg`,
  height: "15"
}), "No activity yet!");

const GithubEvent = props => {
  const event = props.event,
        html_url = props.event.html_url,
        flash = props.flash;
  return preact.h("li", {
    class: flash ? 'animate' : ''
  }, preact.h("img", {
    src: `${assetsDir}/images/${getEventIcon(event)}`,
    height: "15"
  }), preact.h("a", {
    target: "_blank",
    href: html_url
  }, createEventSentence(event)));
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
    }), 1000);
  }

  componentDidMount() {
    twitch.listen('broadcast', this.twitchListenHandler.bind(this));
  }

  render(props, state) {
    const latestEvents = state.latestEvents,
          flash = state.flash;
    const list = latestEvents.map((event, index) => {
      return preact.h(GithubEvent, {
        flash: index === 0 ? flash : false,
        event: event
      });
    });
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
    return preact.h("div", null, preact.h("div", {
      id: "header"
    }, preact.h("span", null, "Code Activity"), preact.h("button", {
      id: "hideButton",
      onClick: () => this.toggleVisibility(),
      title: state.visible ? 'hide' : 'show'
    }, preact.h("img", {
      src: `${assetsDir}/images/${state.visible ? 'eye-off' : 'eye'}.svg`,
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