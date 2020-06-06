import * as core from '@actions/core';
import * as github from '@actions/github';
import { Context } from '@actions/github/lib/context';

let octokit:github.GitHub;
let context:Context;

function createPR(baseBranch:string, headBranch:string, title:string, body:string) {
    console.log('Creating PR ' + name + ' from branch ' + headBranch);

    octokit.pulls.create({
        ...context.repo,
        base: baseBranch,
        head: headBranch,
        title,
        body,
    });
}

function createBranch(name:string, sha:string) {
    console.log('Creating branch ' + name);

    octokit.git.createRef({
        ...context.repo,
        ref: 'refs/heads/' + name,
        sha,
    });
}

function updateMergeBranch(name:string, sha:string) {
    console.log('Fast forwaring branch ' + name);

    octokit.git.updateRef({
        ...context.repo,
        ref: 'refs/heads/' + name,
        sha,
    });
}

async function doesBranchExist(name:string):Promise<boolean> {
    const matchingResults = await octokit.git.listMatchingRefs({
        ...context.repo,
        ref: 'refs/heads/' + name
    });

    console.log(matchingResults, 'Matches for existing branch');

    return matchingResults.data.length > 0;
}

async function doesPullRequestExist(headBranchName:string) {
    const matchingResults = await octokit.pulls.list({
        ...context.repo,
        state: 'open',
        head: headBranchName, // TODO Don't know if we need organization here
    });

    console.log(matchingResults, 'Matches for existing PR');

    return matchingResults.data.length > 0;
}

async function run() {
    // Get config
    const toBranch = core.getInput('to-branch');
    const token = core.getInput('github-token');
    const autoMerge = core.getInput('auto-merge') == 'true' ? true : false;

    octokit = new github.GitHub(token);
    context = github.context;

    const fromBranch = context.ref;

    // TODO Validate that changes happened in from brach. Either here or in workflow configuration if possible
    // TODO Use wildcards in validating branch
    // TODO Compare branches
    const mergeBranchName = `merge/${fromBranch}-to-${toBranch}`;

    // TODO Merge branch if auto merge is on

    const inConflict = false;
    const isExistingMergeBranch = await doesBranchExist(mergeBranchName);
    var isExistingPR = false;

    // Create merge branch if conflict or update existing branch
    if (isExistingMergeBranch) {
        // TODO Update reference with added commits
        updateMergeBranch(mergeBranchName, context.sha);
        isExistingPR = await doesPullRequestExist(mergeBranchName);
    } else {
        createBranch(mergeBranchName, context.sha);
    }

    // Create PR if no auto merge or conflict
    if (!isExistingPR && (!autoMerge || inConflict)) {
        createPR(toBranch, mergeBranchName, 'TODO Title', 'TODO Body');
    }
}

run().catch(core.setFailed)
